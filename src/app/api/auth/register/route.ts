import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, phone, panNumber, nationalIdPhoto, businessName } = body;

    // --- Validation ---
    if (!username || !password || !phone || !panNumber || !businessName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await dbConnect();

    // --- Check uniqueness ---
    const cleanUsername = username.toLowerCase().trim();
    const email = `${cleanUsername}@merobusiness.com`;

    const existingByUsername = await User.findOne({ username: cleanUsername });
    if (existingByUsername) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 400 });
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // --- Create user ---
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: cleanUsername,
      email,
      password: hashedPassword,
      name: businessName,
      phone,
      panNumber,
      nationalIdPhoto: nationalIdPhoto || null,
      businessName,
      role: 'ADMIN',
      status: 'PENDING',
      permissions: { canChangeTheme: false },
      assignedSiteIds: [],
    });

    return NextResponse.json({
      message: "Registration submitted successfully! Your application is pending Super-Admin approval.",
      email: user.email,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
