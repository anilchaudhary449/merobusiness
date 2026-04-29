import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById((session.user as any).id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.requirePasswordChange) {
      return NextResponse.json({ error: "Password reset not required." }, { status: 400 });
    }

    // Hash the new password and reset the flag
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.requirePasswordChange = false;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Reset Password API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
