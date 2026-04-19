import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createWebsiteForUser, listAllWebsites, getWebsitesByIds } from '@/lib/website-repository';
import { createWebsiteSchema } from '@/lib/validations/website';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongoose';
import User from '@/models/User';
import Website from '@/models/Website';

// Get websites based on role
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionUser = session.user as any;

  try {
    await dbConnect();
    let websites;

    if (sessionUser.role === 'SUPER_ADMIN') {
      // Super-Admin sees everything
      websites = await listAllWebsites();
    } else {
      // Admin sees their assigned sites AND sites they own
      const user = await User.findById(sessionUser.id).lean();
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const assignedIds = (user as any)?.assignedSiteIds || [];
      
      // Also fetch sites where this user is the owner (userId)
      const ownedSites = await Website.find({ userId: sessionUser.id }, '_id').lean();
      const ownedIds = ownedSites.map(s => s._id.toString());

      const allMySiteIds = Array.from(new Set([...assignedIds, ...ownedIds]));
      
      websites = await getWebsitesByIds(allMySiteIds);
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Fetch websites error:', error);
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 });
  }
}

// Create a new website (Super-Admin only suggested, but let's keep it restricted to session user)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only Super-Admins can create websites' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { businessName, slug } = createWebsiteSchema.parse(body);
    
    // Website creation is global, so userId could be session user or we null it for assignment later
    const website = await createWebsiteForUser(user.id, { businessName, slug });

    return NextResponse.json(website);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
