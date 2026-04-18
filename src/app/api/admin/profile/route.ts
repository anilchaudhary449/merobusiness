import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'panNumber', 'businessName', 'nationalIdPhoto', 'email'];
    const changesToStash: any = {};
    const directUpdates: any = {};
    let hasChanges = false;

    // Compare and identify actual changes
    for (const field of allowedFields) {
      if (data[field] !== undefined && data[field] !== user[field]) {
         if (user.role === 'SUPER_ADMIN') {
           directUpdates[field] = data[field];
         } else {
           changesToStash[field] = data[field];
         }
         hasChanges = true;
      }
    }

    if (!hasChanges) {
      return NextResponse.json({ message: "No data changed." }, { status: 200 });
    }

    if (user.role === 'SUPER_ADMIN') {
      // Apply changes directly for Super-Admin
      Object.assign(user, directUpdates);
      await user.save();
      return NextResponse.json({ 
        message: "Profile updated successfully.",
        user: { name: user.name, email: user.email, phone: user.phone, panNumber: user.panNumber }
      });
    } else {
      // Stash changes for approval for regular Admins
      const currentPending = user.pendingProfileChanges || {};
      user.pendingProfileChanges = { ...currentPending, ...changesToStash };
      await user.save();
      return NextResponse.json({ 
        message: "Profile changes submitted successfully. They will be applied once approved by a Super Administrator.",
        pendingChanges: user.pendingProfileChanges
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
