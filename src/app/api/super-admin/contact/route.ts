import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    // Fetch the first active SUPER_ADMIN
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN', status: 'ACTIVE' })
      .select('name email phone businessName');
    
    if (!superAdmin) {
      return NextResponse.json({ error: "No administrator contact found" }, { status: 404 });
    }

    return NextResponse.json(superAdmin);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
