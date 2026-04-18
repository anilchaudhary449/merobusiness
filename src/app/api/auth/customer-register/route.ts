import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { validatePhoneNumber } from "@/lib/phone-validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, 
      firstName, 
      middleName, 
      lastName, 
      dob, 
      phone, 
      password, 
      confirmPassword,
      siteId
    } = body;

    // --- Basic Validation ---
    if (!email || !firstName || !lastName || !dob || !phone || !password || !confirmPassword) {
      return NextResponse.json({ error: "Required fields are missing." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // --- Gmail Specific Validation ---
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return NextResponse.json({ error: "Only valid Gmail addresses are allowed." }, { status: 400 });
    }

    // --- Age Validation (Must be at least 16) ---
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return NextResponse.json({ error: "You must be at least 16 years old to create an account." }, { status: 400 });
    }

    // --- Phone Validation ---
    // Try to be robust: handle '+977 98...' or '+97798...' or just '98...'
    let dialCode = body.countryCode || '+977';
    let phoneDigits = phone.replace(/[^0-9]/g, '');

    if (phone.startsWith('+')) {
      // If the phone itself starts with +, try to parse it
      // We'll look for a space first as a hint
      if (phone.includes(' ')) {
        const parts = phone.split(' ');
        dialCode = parts[0];
        phoneDigits = parts.slice(1).join('').replace(/[^0-9]/g, '');
      } else {
        // No space, but starts with +. We'll assume the first few digits are the dial code
        // and let the validator handle the lookup.
        // If we have countryCode from body, we use that as a fallback.
        dialCode = body.countryCode || '+977';
        phoneDigits = phone.replace(dialCode, '').replace(/[^0-9]/g, '');
      }
    }

    const phoneValidation = validatePhoneNumber(dialCode, phoneDigits);
    
    if (!phoneValidation.isValid) {
      return NextResponse.json({ 
        error: phoneValidation.error || "Invalid phone number format." 
      }, { status: 400 });
    }

    await dbConnect();

    // --- Check Uniqueness ---
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // --- Create Customer ---
    const hashedPassword = await bcrypt.hash(password, 12);
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'CUSTOMER',
      name: fullName,
      firstName,
      middleName,
      lastName,
      dob: dobDate,
      phone,
      status: 'ACTIVE', // Customers can start shopping immediately
      permissions: { canChangeTheme: false },
      assignedSiteIds: siteId ? [siteId] : [],
    });

    return NextResponse.json({
      message: "Registration successful! You can now log in.",
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Customer Registration error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
