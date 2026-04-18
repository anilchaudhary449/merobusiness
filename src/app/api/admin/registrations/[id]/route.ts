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

// PATCH: Approve or Reject a registration
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { action, rejectionReason } = await req.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    await dbConnect();
    const update: any = {
      status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
    };
    if (action === 'reject' && rejectionReason) {
      update.rejectionReason = rejectionReason;
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-password' });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ message: `User ${action}d successfully.`, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a rejected registration
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await dbConnect();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Registration removed." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
