import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Website from "@/models/Website";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can view their order history" }, { status: 403 });
    }

    const customerId = (session.user as any).id || (session.user as any)._id;

    await dbConnect();

    // Fetch orders tied to this customer, populate site details for display
    const orders = await Order.find({ customerId })
      .populate({ path: 'siteId', model: Website, select: 'businessName logoUrl' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error: any) {
    console.error("Fetch customer orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
