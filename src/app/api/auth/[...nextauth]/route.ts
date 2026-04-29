import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

// In-memory rate limiter (Warning: Resets on server restart/serverless instance spin down)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginContext: { label: "Login Context", type: "text" }, // 'customer' | 'admin'
      },
      async authorize(credentials) {
        if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
          console.error("FATAL ERROR: NEXTAUTH_SECRET is not defined in production environment.");
        }
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const email = credentials.email.toLowerCase();
        
        // --- Rate Limiting Logic ---
        const now = Date.now();
        const attemptTracker = loginAttempts.get(email) || { count: 0, resetAt: now + LOCKOUT_DURATION_MS };
        
        if (now > attemptTracker.resetAt) {
          // Reset if lockout period has passed
          attemptTracker.count = 0;
          attemptTracker.resetAt = now + LOCKOUT_DURATION_MS;
        }

        if (attemptTracker.count >= MAX_ATTEMPTS) {
          throw new Error("Too many login attempts. Please try again in 5 minutes.");
        }
        
        // Keep tracker updated
        loginAttempts.set(email, attemptTracker);

        console.log("Auth attempt for:", email);
        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user || !user.password) {
            console.warn("User not found:", credentials.email);
            throw new Error("User not found or password not set");
          }

          // ──────────────────────────────────────────
          // Role-Based Login Context Enforcement
          // ──────────────────────────────────────────
          const isCustomerLogin = credentials.loginContext === 'customer';

          if (isCustomerLogin) {
            // Customer store: CUSTOMER accounts must use @gmail.com
            // ADMIN and SUPER_ADMIN with @merobusiness.com can also access the store
            if (user.role === 'CUSTOMER') {
              if (!user.email.endsWith('@gmail.com')) {
                throw new Error("Customer accounts must use a Gmail address.");
              }
            } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
              if (!user.email.endsWith('@merobusiness.com')) {
                throw new Error("Admin accounts must use their @merobusiness.com address.");
              }
              // Admins are allowed to browse/access the store — no block
            } else {
              throw new Error("Unrecognized account type.");
            }
          } else {
            // Admin portal (/login): CUSTOMER accounts are strictly forbidden
            if (user.role === 'CUSTOMER') {
              throw new Error("Customer accounts cannot access the admin portal. Please use the store login instead.");
            }
            // Admin portal: only @merobusiness.com emails are authorized
            if (!user.email.endsWith('@merobusiness.com')) {
              throw new Error("Only @merobusiness.com accounts are authorized for admin access.");
            }
          }

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

          // Login successful, reset rate limiter
          loginAttempts.delete(email);

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            permissions: user.permissions,
            assignedSiteIds: user.assignedSiteIds,
          };
        } catch (error: any) {
          console.error("NextAuth authorize error:", error.message || error);
          
          // Increment failure counter
          attemptTracker.count += 1;
          loginAttempts.set(email, attemptTracker);
          
          // Artificial delay to thwart brute force timing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
