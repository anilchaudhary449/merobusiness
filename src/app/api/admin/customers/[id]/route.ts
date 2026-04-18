import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  try {
    const body = await req.json();
    const { firstName, middleName, lastName, email, phone, dob, newPassword, status, deliveryAddress, mapLocation } = body;

    const updatePayload: any = {};
    if (firstName) updatePayload.firstName = firstName;
    if (middleName !== undefined) updatePayload.middleName = middleName;
    if (lastName) updatePayload.lastName = lastName;
    if (email) {
      updatePayload.email = email.toLowerCase().trim();
    }
    if (phone) updatePayload.phone = phone;
    if (dob) updatePayload.dob = new Date(dob);
    if (status) updatePayload.status = status;
    if (deliveryAddress !== undefined) updatePayload.deliveryAddress = deliveryAddress;
    if (mapLocation !== undefined) updatePayload.mapLocation = mapLocation;

    // Reconstruct the name field from firstName/lastName for consistency
    if (firstName || lastName) {
      const customer = await User.findById(id);
      const fName = firstName || customer?.firstName || '';
      const mName = middleName ?? customer?.middleName ?? '';
      const lName = lastName || customer?.lastName || '';
      updatePayload.name = `${fName} ${mName ? mName + ' ' : ''}${lName}`.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updatePayload.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, select: '-password' }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer updated successfully', customer: updated });
  } catch (error: any) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ message: 'Customer deleted' });
  } catch (error: any) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
