import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { validatePhoneNumber } from "@/lib/phone-validation";

async function getSuperAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

// PATCH: Update an Admin (Super-Admin can update any field)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await req.json();
    await dbConnect();

    // Build safe update object with all allowed fields
    const allowedFields = ['name', 'email', 'username', 'phone', 'panNumber', 'businessName', 
      'nationalIdPhoto', 'permissions', 'assignedSiteIds', 'status', 'rejectionReason'];
    
    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Validation for phone
        if (field === 'phone' && data[field]) {
          const [dialCode, ...rest] = data[field].split(' ');
          const phoneDigits = rest.join('');
          const validation = validatePhoneNumber(dialCode, phoneDigits);
          if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
          }
        }
        updateData[field] = data[field];
      }
    }

    // Hash password only if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // Clear pending changes if super-admin is doing a direct edit
    updateData.pendingChanges = null;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an Admin
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
