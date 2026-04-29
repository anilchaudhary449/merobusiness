import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' }, { status: 400 });
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename strictly to prevent path traversal & weird characters
    const parsedPath = parse(file.name);
    const sanitizedName = parsedPath.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const sanitizedExt = parsedPath.ext.replace(/[^a-zA-Z0-9.]/g, '');
    const filename = `${Date.now()}-${sanitizedName}${sanitizedExt}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      success: true 
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url || !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // Parse out just the filename from the URL safely
    const filename = url.replace('/uploads/', '').replace(/[^a-zA-Z0-9.\-_]/g, '');
    
    if (!filename) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Security: Ensure the resolved path is strictly inside the uploads directory
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Security violation' }, { status: 403 });
    }

    if (existsSync(filePath)) {
      await require('fs/promises').unlink(filePath);
    }

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
