import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { suggestCategories } from '@/lib/services/newsapi';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch pending items from Bucket
    const { data: bucketItems } = await supabaseAdmin
      .from('prefix_bucket')
      .select('*')
      .eq('type', 'CATEGORY')
      .eq('is_processed', false)
      .limit(10); // Batch size

    if (!bucketItems || bucketItems.length === 0) {
      return NextResponse.json({ message: 'No pending categories to hydrate.' });
    }

    let processedCount = 0;

    // 2. Process in Parallel
    await Promise.all(bucketItems.map(async (item) => {
      try {
        const suggestions = await suggestCategories(item.prefix);
        
        if (suggestions && suggestions.length > 0) {
          // Map API response to DB Schema
          const rows = suggestions.map((s: any) => ({
            uri: s.uri,
            label: s.label,
            parent_uri: s.parentUri,
            wgt: s.wgt || 0
          }));

          // Upsert to Main Table
          await supabaseAdmin.from('news_categories').upsert(rows, { onConflict: 'uri' });
        }

        // Mark bucket item as processed
        await supabaseAdmin.from('prefix_bucket').update({ is_processed: true }).eq('id', item.id);
        processedCount++;
      } catch (err) {
        console.error(`Failed to hydrate category: ${item.prefix}`, err);
      }
    }));

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}