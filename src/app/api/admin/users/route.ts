import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { validatePhoneNumber } from "@/lib/phone-validation";

// Utility to check if user is Super-Admin
async function getSuperAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

// GET: List all Admins
export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const admins = await User.find({ role: 'ADMIN' }, '-password').sort({ createdAt: -1 });
    return NextResponse.json(admins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new Admin
export async function POST(req: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, password, name, phone, permissions, assignedSiteIds } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Phone Validation
    if (phone) {
      const [dialCode, ...rest] = phone.split(' ');
      const phoneDigits = rest.join('');
      const validation = validatePhoneNumber(dialCode, phoneDigits);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    await dbConnect();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      role: 'ADMIN',
      permissions: permissions || { canChangeTheme: false },
      assignedSiteIds: assignedSiteIds || [],
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE, PATCH can be handled here or in [id]/route.ts. 
// For simplicity, let's keep them here for now or add [id] route if it gets complex.
