import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import Website from '@/models/Website';
import { createWebsiteSchema } from '@/lib/validations/website';
import { z } from 'zod';

// Get all websites for the current user mock
export async function GET(req: Request) {
  try {
    await dbConnect();
    // In MVP we mock the userId as "user_123"
    const websites = await Website.find({ userId: 'user_123' }).sort({ createdAt: -1 });
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
    
    await dbConnect();
    
    // Check if slug exists
    const existing = await Website.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'URL Slug already taken' }, { status: 400 });
    }

    const website = await Website.create({
      userId: 'user_123', // mocked
      businessName,
      slug,
      
      // Premium Starting Defaults
      primaryColor: '#f59e0b', // Modern Amber
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
      headingWeight: '800',
      navAnimationStyle: 'reveal',
      heroAnimationStyle: 'reveal',
      animationStyle: 'fade-in',
      
      content: {
        hero: {
          title: `Welcome to ${businessName}`,
          subtitle: 'Experience quality and excellence like never before.',
          imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop',
          ctaText: 'Explore Our Collection',
        },
        about: {
          description: `${businessName} is dedicated to providing the best service in Nepal. Our passion for quality drives everything we do.`,
          imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop',
        },
        products: []
      }
    });

    return NextResponse.json(website);
  } catch (error: any) {
    // Handle Zod validation errors safely
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
