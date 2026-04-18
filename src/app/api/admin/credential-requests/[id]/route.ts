import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import CredentialRequest from "@/models/CredentialRequest";
import User from "@/models/User";

async function getSuperAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

// Placeholder for email sending service
async function sendCredentialsEmail(email: string, name: string) {
  console.log(`Sending credentials to ${email} for user ${name}...`);
  // Enterprise implementation would use Nodemailer/Resend/etc here.
  return true;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await req.json(); // 'resolve' or 'reject'

    await dbConnect();
    const request = await CredentialRequest.findById(id).populate('userId');
    
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === 'resolve') {
      const user = await User.findById(request.userId);
      if (user) {
        await sendCredentialsEmail(user.email, user.name || 'User');
      }
      
      request.status = 'RESOLVED';
      await request.save();
      
      return NextResponse.json({ message: "Credential request resolved and email invitation sent." });
    }

    if (action === 'reject') {
      request.status = 'REJECTED';
      await request.save();
      return NextResponse.json({ message: "Credential request rejected." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Resolve credential request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
