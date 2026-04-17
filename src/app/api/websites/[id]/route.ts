import { NextResponse } from 'next/server';
import {
  deleteWebsiteById,
  getWebsiteById,
  toggleWebsiteActiveById,
  updateWebsiteById,
} from '@/lib/website-repository';

// Get a single website by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const website = await getWebsiteById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// Update a website
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    console.log('--- UPDATING WEBSITE DATA ---');
    console.log('ID:', id);
    console.log('New Fields Check:', {
      heroHeadingColor: data.heroHeadingColor,
      footerBgColor: data.footerBgColor,
      navBgColor: data.navBgColor
    });
    console.log('----------------------------');
    const website = await updateWebsiteById(id, data);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a website
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const website = await deleteWebsiteById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// Toggle active status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const website = await toggleWebsiteActiveById(id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
