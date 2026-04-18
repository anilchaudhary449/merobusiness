import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import CredentialRequest from "@/models/CredentialRequest";

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
    // Populate userId to show name and DOB for verification
    const requests = await CredentialRequest.find({})
      .populate('userId', 'name dob email firstName middleName lastName')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Fetch credential requests error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
