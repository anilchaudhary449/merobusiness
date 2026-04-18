import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

async function getSuperAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    // Fetch all users with CUSTOMER role
    const customers = await User.find({ role: 'CUSTOMER' }, '-password').sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Fetch customers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
