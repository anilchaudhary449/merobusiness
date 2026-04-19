import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 200 });

  try {
    const { siteId } = await params;
    await dbConnect();
    const items = await Wishlist.find({ userId: (session.user as any).id, siteId });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please log in to save items." }, { status: 401 });
  }

  try {
    const { siteId } = await params;
    const { productId } = await req.json();

    await dbConnect();
    
    // Using upsert logic or just unique index
    const item = await Wishlist.findOneAndUpdate(
      { userId: (session.user as any).id, siteId, productId },
      { userId: (session.user as any).id, siteId, productId },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { siteId } = await params;
    const { productId } = await req.json();

    await dbConnect();
    await Wishlist.deleteOne({ userId: (session.user as any).id, siteId, productId });
    
    return NextResponse.json({ message: "Item removed from wishlist" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
