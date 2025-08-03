import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { cwd } from 'process';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(cwd(), 'public/uploads');
    const fullPath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    await require('fs').promises.mkdir(uploadDir, { recursive: true });

    await writeFile(fullPath, buffer);

    console.log(`File uploaded to ${fullPath}`);
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: 'File upload failed.' }, { status: 500 });
  }
}