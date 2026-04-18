import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import CredentialRequest from "@/models/CredentialRequest";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await dbConnect();

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // For security, don't reveal if a user exists. But since this goes to Super-Admin, 
      // we can be more specific or generic. Standard practice is generic.
      return NextResponse.json({ 
        message: "If an account exists with this email, a reset request has been sent to the Super-Admin." 
      });
    }

    // Check if a pending request already exists
    const existingRequest = await CredentialRequest.findOne({ 
      userId: user._id, 
      status: 'PENDING' 
    });

    if (existingRequest) {
      return NextResponse.json({ 
        message: "A password reset request is already pending review by the Super-Admin." 
      });
    }

    // Create a new request
    await CredentialRequest.create({
      userId: user._id,
      email: user.email,
      type: 'PASSWORD_RESET',
      status: 'PENDING',
    });

    return NextResponse.json({ 
      message: "Your request has been submitted. A Super-Admin will verify your details and contact you." 
    });

  } catch (error: any) {
    console.error("Forgot Password Request error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
