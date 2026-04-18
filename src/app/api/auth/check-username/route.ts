import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.toLowerCase().trim();

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, message: "Username must be at least 3 characters." });
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, message: "Only letters, numbers, and underscores allowed." });
  }

  try {
    await dbConnect();
    const existing = await User.findOne({ username });
    return NextResponse.json({
      available: !existing,
      message: existing ? "Username is already taken." : "Username is available!",
    });
  } catch (error: any) {
    return NextResponse.json({ available: false, message: error.message }, { status: 500 });
  }
}
