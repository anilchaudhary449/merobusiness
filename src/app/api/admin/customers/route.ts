import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import CredentialResetRecord from "@/models/CredentialResetRecord";

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
    const customers = await User.find({ role: 'CUSTOMER' }, '-password').sort({ createdAt: -1 }).lean();
    
    const customerIds = customers.map((c: any) => c._id.toString());
    
    const resetLogs = await CredentialResetRecord.find({
      userId: { $in: customerIds }
    }).sort({ createdAt: -1 }).lean();

    const customersWithLogs = customers.map((c: any) => ({
      ...c,
      resetLogs: resetLogs.filter((l: any) => l.userId.toString() === c._id.toString())
    }));

    return NextResponse.json(customersWithLogs);
  } catch (error: any) {
    console.error("Fetch customers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
