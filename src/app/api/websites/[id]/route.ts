import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import Website from '@/models/Website';

// Get a single website by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const website = await Website.findById(params.id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(website);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// Update a website
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    console.log('--- UPDATING WEBSITE DATA ---');
    console.log('ID:', params.id);
    console.log('New Fields Check:', {
      heroHeadingColor: data.heroHeadingColor,
      footerBgColor: data.footerBgColor,
      navBgColor: data.navBgColor
    });
    console.log('----------------------------');
    await dbConnect();
    
    const website = await Website.findByIdAndUpdate(params.id, data, { new: true });
    return NextResponse.json(website);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a website
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const website = await Website.findByIdAndDelete(params.id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// Toggle active status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const website = await Website.findById(params.id);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    website.isActive = !website.isActive;
    await website.save();
    return NextResponse.json({ isActive: website.isActive });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
