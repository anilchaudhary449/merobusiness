import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  deleteWebsiteById,
  getWebsiteById,
  toggleWebsiteActiveById,
  updateWebsiteById,
} from '@/lib/website-repository';

async function checkAccess(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: 'Unauthorized', status: 401 };

  const user = session.user as any;
  if (user.role === 'SUPER_ADMIN') return { user };
  
  if (user.assignedSiteIds?.includes(id)) return { user };

  return { error: 'Forbidden', status: 403 };
}

// Get a single website by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, status } = await checkAccess(id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const website = await getWebsiteById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// Update a website
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, status, user } = await checkAccess(id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const data = await req.json();

    // Check theme selection permission for Admins
    if (user.role === 'ADMIN' && !user.permissions?.canChangeTheme) {
      const current = await getWebsiteById(id);
      if (current && data.theme && data.theme !== current.theme) {
        return NextResponse.json({ error: 'Theme selection is locked by administrator' }, { status: 403 });
      }
    }

    const website = await updateWebsiteById(id, data);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a website
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, status, user } = await checkAccess(id);
  if (error) return NextResponse.json({ error }, { status });

  // Only Super-Admin or site owner? The request says Super-Admin manages Admin/Sites.
  // Usually delete is a Super-Admin power.
  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const website = await deleteWebsiteById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// Toggle active status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, status, user } = await checkAccess(id);
  if (error) return NextResponse.json({ error }, { status });

  // Only Super-Admin can toggle status based on the dashboard logic (or site owner?)
  // User request: "super admin will have permission to... modify the accesses of admin and his/her sites"
  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const website = await toggleWebsiteActiveById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
