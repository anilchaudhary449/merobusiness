import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Website from "@/models/Website";

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

    // Fetch the admin's actual full profile from DB to get their assigned sites
    const adminUser = await User.findOne({ email });
    if (!adminUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    let mySiteIds: string[] = [];

    if (role === "SUPER_ADMIN") {
      // Super admins could potentially see all, but here this API is specifically for an admin's OWN customers based on stores.
      // If Super-Admin wants to see everything, they have a different dashboard, but here they might want to see customers across all sites.
      const allSites = await Website.find({}, '_id');
      mySiteIds = allSites.map(s => s._id.toString());
    } else {
      mySiteIds = adminUser.assignedSiteIds || [];
    }

    if (mySiteIds.length === 0) {
      return NextResponse.json({ customers: [] }, { status: 200 });
    }

    // Find all customers whose assignedSiteIds overlaps with the admin's siteIds
    const customers = await User.find({
      role: 'CUSTOMER',
      assignedSiteIds: { $in: mySiteIds }
    }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch my customers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
