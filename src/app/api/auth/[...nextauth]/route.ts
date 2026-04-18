import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
          console.error("FATAL ERROR: NEXTAUTH_SECRET is not defined in production environment.");
        }
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        console.log("Auth attempt for:", credentials.email);
        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user || !user.password) {
            console.warn("User not found:", credentials.email);
            throw new Error("User not found or password not set");
          }

          // Block login for non-active accounts
          if (user.status === 'PENDING') {
            throw new Error("Your account is pending approval by the Super-Admin. Please wait.");
          }
          if (user.status === 'REJECTED') {
            throw new Error("Your registration has been rejected. Please contact the administrator.");
          }

          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordCorrect) {
            console.warn("Invalid password for:", credentials.email);
            throw new Error("Incorrect password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            permissions: user.permissions,
            assignedSiteIds: user.assignedSiteIds,
          };
        } catch (error: any) {
          console.error("NextAuth authorize error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.assignedSiteIds = (user as any).assignedSiteIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).assignedSiteIds = token.assignedSiteIds;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors back to login with error params
  },
  session: {
    strategy: "jwt",
  },
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning [${code}]`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
