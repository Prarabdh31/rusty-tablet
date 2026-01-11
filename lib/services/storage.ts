import { createClient } from '@supabase/supabase-js';

// We need the SERVICE_ROLE_KEY to upload files to storage from the backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadImageToStorage(
  imageBuffer: ArrayBuffer | Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const bucket = 'article_media';
    const path = `${Date.now()}-${filename}`;

    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(path, imageBuffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error('Storage Service Failed:', error);
    return null;
  }
}