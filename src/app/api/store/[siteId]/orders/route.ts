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
    const { customerId, product, method, paymentMethod, paymentReceipt } = body;

    if (!siteId || !customerId || !product || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Resolve siteId (slug) to actual site _id for data consistency
    const Website = (await import("@/models/Website")).default;
    const site = await Website.findOne({ slug: siteId });
    if (!site) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    const actualSiteId = site._id.toString();

    // Verify user exists and update their assignedSiteIds if needed
    const customer = await User.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (!customer.assignedSiteIds.includes(actualSiteId)) {
      await User.updateOne(
        { _id: customerId },
        { $addToSet: { assignedSiteIds: actualSiteId } }
      );
    }

    // Create the order
    const order = await Order.create({
      siteId: actualSiteId,
      customerId,
      product,
      method,
      paymentMethod: paymentMethod || 'COD',
      paymentReceipt: paymentReceipt || '',
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
