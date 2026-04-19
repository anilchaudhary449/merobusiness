import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Website from "@/models/Website";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, email } = session.user as any;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const adminUser = await User.findOne({ email });
    if (!adminUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    let mySiteIdentifiers: string[] = [];

    if (role === "SUPER_ADMIN") {
      const allSites = await Website.find({}, '_id slug');
      mySiteIdentifiers = [
        ...allSites.map(s => s._id.toString()),
        ...allSites.map(s => s.slug).filter(Boolean)
      ];
    } else {
      // Admins manage sites they own (userId) and any sites manually assigned to them (assignedSiteIds)
      const ownedSites = await Website.find({ userId: adminUser._id.toString() }, '_id slug');
      const assignedSites = await Website.find({ _id: { $in: adminUser.assignedSiteIds || [] } }, '_id slug');
      
      mySiteIdentifiers = Array.from(new Set([
        ...ownedSites.map(s => s._id.toString()),
        ...ownedSites.map(s => s.slug).filter(Boolean),
        ...assignedSites.map(s => s._id.toString()),
        ...assignedSites.map(s => s.slug).filter(Boolean)
      ]));
    }

    if (mySiteIdentifiers.length === 0) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    // Find all orders tied to the admin's sites, populated with customer details
    const orders = await Order.find({
      siteId: { $in: mySiteIdentifiers }
    })
    .populate('customerId', 'name email phone deliveryAddress username mapLocation')
    .sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch my orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
