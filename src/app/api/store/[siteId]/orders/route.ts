import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await req.json();
    const { customerId, product, method } = body;

    if (!siteId || !customerId || !product || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Verify user exists and update their assignedSiteIds if needed
    const customer = await User.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (!customer.assignedSiteIds.includes(siteId)) {
      await User.updateOne(
        { _id: customerId },
        { $addToSet: { assignedSiteIds: siteId } }
      );
    }

    // Create the order
    const order = await Order.create({
      siteId,
      customerId,
      product,
      method,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
