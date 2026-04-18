import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { action } = await req.json(); // 'approve' or 'reject'
    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.pendingProfileChanges) {
      return NextResponse.json({ error: "No pending changes found for this user" }, { status: 400 });
    }

    let updateData: any = {};

    if (action === 'approve') {
      // Merge pending changes into the main user document
      updateData = { ...user.pendingProfileChanges };
    }
    
    // Always clear the pending changes, whether approved or rejected
    updateData.pendingProfileChanges = null;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    
    return NextResponse.json({ message: `Changes ${action}d successfully`, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
