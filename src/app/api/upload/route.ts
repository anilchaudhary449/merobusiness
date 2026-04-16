import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
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
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url || !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const filename = url.replace('/uploads/', '');
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    // Security: Ensure the resolved path is still within the uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Security violation' }, { status: 403 });
    }

    if (existsSync(filePath)) {
      await require('fs/promises').unlink(filePath);
    }

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
