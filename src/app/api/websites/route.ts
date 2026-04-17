import { NextResponse } from 'next/server';
import { createWebsiteForUser, listWebsitesByUser } from '@/lib/website-repository';
import { createWebsiteSchema } from '@/lib/validations/website';
import { z } from 'zod';

// Get all websites for the current user mock
export async function GET(req: Request) {
  try {
    const websites = await listWebsitesByUser('user_123');
    return NextResponse.json(websites);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 });
  }
}

// Create a new website
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request payload using Zod
    const { businessName, slug } = createWebsiteSchema.parse(body);
    const website = await createWebsiteForUser('user_123', { businessName, slug });

    return NextResponse.json(website);
  } catch (error: any) {
    // Handle Zod validation errors safely
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 422 });
    }
    if (error?.message === 'URL Slug already taken') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
