import { NextResponse } from 'next/server';
import { getWebsiteBySlug } from '@/lib/website-repository';

// Get a single website by slug
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const website = await getWebsiteBySlug(slug);
    if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (website.isActive === false) {
      return NextResponse.json({ error: 'This store is currently unavailable.' }, { status: 503 });
    }
    return NextResponse.json(website);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
