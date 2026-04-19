import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Website from "@/models/Website";
import Order from "@/models/Order";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, email } = session.user as any;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminUser = await User.findOne({ email });
    if (!adminUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, paymentMethod } = body;
    const { id } = await params;

    await dbConnect();

    // Verify the order exists and the admin has permission to modify it
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (role !== "SUPER_ADMIN") {
      const ownedSites = await Website.find({ userId: adminUser._id.toString() }, '_id slug');
      const assignedSites = await Website.find({ _id: { $in: adminUser.assignedSiteIds || [] } }, '_id slug');
      
      const mySiteIdentifiers = Array.from(new Set([
        ...ownedSites.map(s => s._id.toString()),
        ...ownedSites.map(s => s.slug).filter(Boolean),
        ...assignedSites.map(s => s._id.toString()),
        ...assignedSites.map(s => s.slug).filter(Boolean)
      ]));
      
      if (!mySiteIdentifiers.includes(order.siteId)) {
         return NextResponse.json({ error: "Forbidden: You don't manage this store" }, { status: 403 });
      }
    }

    if (status) order.status = status;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    await order.save();

    return NextResponse.json({ success: true, order }, { status: 200 });

  } catch (error: any) {
    console.error("Order modification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
