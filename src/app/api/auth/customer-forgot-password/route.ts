import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import CredentialResetRecord from "@/models/CredentialResetRecord";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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
      // Return success even if user doesn't exist to prevent enumeration attacks
      return NextResponse.json({ 
        message: "If an account exists with this email, a temporary password has been generated. Please check your email." 
      });
    }

    // 1. Generate a secure random 8-character password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // 2. Update user with new password and requirePasswordChange flag
    user.password = hashedPassword;
    user.requirePasswordChange = true;
    await user.save();

    // 3. Log the reset event
    // Find the admin responsible for this user (if CUSTOMER)
    // For admins, adminId will be null
    let adminId = null;
    if (user.role === 'CUSTOMER' && user.assignedSiteIds && user.assignedSiteIds.length > 0) {
      // Find the admin who owns or is assigned to this site
      const admin = await User.findOne({
        role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
        $or: [
          { assignedSiteIds: { $in: user.assignedSiteIds } },
          // Note: Website owner check is more complex here without Website model,
          // but we can just leave adminId as null if not found directly via assignedSiteIds.
        ]
      });
      if (admin) {
        adminId = admin._id;
      }
    }

    await CredentialResetRecord.create({
      userId: user._id,
      userRole: user.role,
      adminId: adminId,
      resetBy: 'SYSTEM',
    });

    // 4. Return response
    // WARNING: In production, do NOT return the password in the API. Email it instead.
    // For this demonstration/no-email environment, we return it to the UI.
    return NextResponse.json({ 
      message: `Password reset successful. Your temporary password is: ${tempPassword}. You must use this to log in immediately and create a new password.`,
      tempPassword: tempPassword // Provide this explicitly so frontend can show it in an alert
    });

  } catch (error: any) {
    console.error("Forgot Password Request error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
