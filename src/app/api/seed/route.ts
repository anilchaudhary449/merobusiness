import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    console.log("Seeding started...");
    await dbConnect();
    
    const adminEmail = "superadmin@merobusiness.com";
    const existing = await User.findOne({ email: adminEmail });
    
    if (existing) {
      console.log("Super Admin already exists");
      return NextResponse.json({ message: "Super Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    const user = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: "Super Administrator",
      role: 'SUPER_ADMIN',
      permissions: {
        canChangeTheme: true,
      },
      assignedSiteIds: [],
    });

    console.log("Super Admin created:", user.email);
    return NextResponse.json({ 
      message: "Super Admin created successfully",
      email: adminEmail,
      password: "admin123"
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
