import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// GET own profile
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ email: (session.user as any).email }).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(user);
}

// PATCH own profile
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { firstName, middleName, lastName, phone, deliveryAddress, mapLocation, currentPassword, newPassword } = body;

    const user = await User.findOne({ email: (session.user as any).email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updatePayload: any = {};
    if (firstName) updatePayload.firstName = firstName;
    if (middleName !== undefined) updatePayload.middleName = middleName;
    if (lastName) updatePayload.lastName = lastName;
    if (phone) updatePayload.phone = phone;
    if (deliveryAddress !== undefined) updatePayload.deliveryAddress = deliveryAddress;
    if (mapLocation !== undefined) updatePayload.mapLocation = mapLocation;

    if (firstName || lastName) {
      const fName = firstName || user.firstName || '';
      const mName = middleName ?? user.middleName ?? '';
      const lName = lastName || user.lastName || '';
      updatePayload.name = `${fName} ${mName ? mName + ' ' : ''}${lName}`.trim();
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new one.' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      }
      updatePayload.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: updatePayload },
      { new: true, select: '-password' }
    );

    return NextResponse.json({ message: 'Profile updated successfully', user: updated });
  } catch (error: any) {
    console.error('Customer profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
