import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { suggestConcepts } from '@/lib/services/newsapi';

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
    const { data: bucketItems } = await supabaseAdmin
      .from('prefix_bucket')
      .select('*')
      .eq('type', 'CONCEPT')
      .eq('is_processed', false)
      .limit(10);

    if (!bucketItems || bucketItems.length === 0) {
      return NextResponse.json({ message: 'No pending concepts to hydrate.' });
    }

    let processedCount = 0;

    await Promise.all(bucketItems.map(async (item) => {
      try {
        const suggestions = await suggestConcepts(item.prefix);
        
        if (suggestions && suggestions.length > 0) {
          const rows = suggestions.map((s: any) => ({
            uri: s.uri,
            label: s.label?.eng || s.label, // Handle localized label
            type: s.type,
            score: s.score,
            image: s.image || null
          }));

          await supabaseAdmin.from('news_concepts').upsert(rows, { onConflict: 'uri' });
        }

        await supabaseAdmin.from('prefix_bucket').update({ is_processed: true }).eq('id', item.id);
        processedCount++;
      } catch (err) {
        console.error(`Failed to hydrate concept: ${item.prefix}`, err);
      }
    }));

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}