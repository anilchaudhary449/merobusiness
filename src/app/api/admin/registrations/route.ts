import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

async function getSuperAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') return null;
  return session;
}

// GET: List all pending registrations
export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const pending = await User.find(
      { status: 'PENDING', role: 'ADMIN' },
      '-password'
    ).sort({ createdAt: -1 });
    return NextResponse.json(pending);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
