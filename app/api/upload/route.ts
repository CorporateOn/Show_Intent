import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }
        
        // Create a unique file path
        const filePath = `public/${Date.now()}-${file.name}`;

        // Upload the file to the 'menu-images' bucket
        const { data, error: uploadError } = await supabase.storage
            .from('menu-images') // The bucket name you created
            .upload(filePath, file);

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error('Failed to upload file to Supabase.');
        }

        // Get the public URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('menu-images')
            .getPublicUrl(filePath);

        if (!publicUrl) {
            throw new Error('Could not get public URL for the uploaded file.');
        }

        return NextResponse.json({ url: publicUrl });

    } catch (error) {
        console.error('Error in upload route:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}