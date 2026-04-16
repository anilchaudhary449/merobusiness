import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import Website from '@/models/Website';

// Get a single website by slug
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    await dbConnect();
    const website = await Website.findOne({ slug: params.slug });
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (website.isActive === false) {
      return NextResponse.json({ error: 'This store is currently unavailable.' }, { status: 503 });
    }
    return NextResponse.json(website);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
