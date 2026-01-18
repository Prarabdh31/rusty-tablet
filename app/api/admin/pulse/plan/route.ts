import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- HELPER: Weighted Random Picker ---
// Input: { "US": 50, "IN": 30 } -> Output: "US" or "IN" based on probability
function pickWeighted(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of Object.entries(weights)) {
    if (random < weight) return key;
    random -= weight;
  }
  return Object.keys(weights)[0]; // Fallback
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Load Strategy
    const { data: config } = await supabaseAdmin.from('pulse_config').select('*').single();
    if (!config) throw new Error("No Pulse Config found");

    // 2. Calculate Schedule
    const articlesPerDay = config.articles_per_day || 12;
    const intervalMinutes = (24 * 60) / articlesPerDay;
    const queueItems = [];
    let nextRun = new Date(); // Start from Now

    // Constants for Phantom Engine fallback
    const RSS_FEEDS_LIST = [
        "https://www.theverge.com/rss/index.xml", 
        "https://hackaday.com/blog/feed/",
        "https://techcrunch.com/feed/"
    ];
    
    // 3. Generate Job Tickets
    for (let i = 0; i < articlesPerDay; i++) {
      // Advance time
      nextRun = new Date(nextRun.getTime() + intervalMinutes * 60000);

      // Roll the dice
      const sourceMode = pickWeighted(config.source_weights);
      const imageSource = pickWeighted(config.image_weights);
      const region = pickWeighted(config.region_weights);
      const sentiment = pickWeighted(config.sentiment_weights);
      
      // Determine Job Params based on Source Mode
      let jobParams: any = {
         target_region: region,
         article_sentiment: sentiment,
         word_count: 800,
         complexity: 'GENERAL',
         include_sidebar: true,
         generate_social: true
      };

      if (sourceMode === 'news_api_tailored') {
         // Pick random topic from bank
         const topic = config.topic_list[Math.floor(Math.random() * config.topic_list.length)];
         jobParams.mode = 'NEWS_API_AI';
         jobParams.config = {
             ...jobParams,
             news_mode: 'TAILORED',
             news_topic: topic
         };
      } 
      else if (sourceMode === 'news_api_automatic') {
         // Pick random category
         const cats = ['Technology', 'Business', 'Science', 'Politics'];
         const randomCat = cats[Math.floor(Math.random() * cats.length)];
         jobParams.mode = 'NEWS_API_AI';
         jobParams.config = {
             ...jobParams,
             news_mode: 'AUTOMATIC',
             news_category: randomCat
         };
      }
      else {
         // Specific RSS (Fallback to random feed from list if not configured in DB, 
         // ideally we store feed list in DB too, but hardcoded list for now is safer)
         const randomFeed = RSS_FEEDS_LIST[Math.floor(Math.random() * RSS_FEEDS_LIST.length)];
         jobParams.mode = 'SPECIFIC_RSS';
         jobParams.config = {
             ...jobParams,
             rss_url: randomFeed
         };
      }

      // Add Image Hint (Phantom Engine doesn't have explicit "source" param yet in input, 
      // but we can pass it via a specialized config if we update Phantom later. 
      // For now, Phantom auto-prioritizes. We will store intent here.)
      jobParams.config.preferred_image_source = imageSource; 

      queueItems.push({
        scheduled_at: nextRun.toISOString(),
        status: 'PENDING',
        job_params: jobParams
      });
    }

    // 4. Bulk Insert to Queue
    const { error: insertError } = await supabaseAdmin.from('pulse_queue').insert(queueItems);
    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      message: `Scheduled ${queueItems.length} jobs for the next 24 hours.` 
    });

  } catch (error: any) {
    console.error("Planner Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}