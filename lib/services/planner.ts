import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function pickWeighted(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of Object.entries(weights)) {
    if (random < weight) return key;
    random -= weight;
  }
  return Object.keys(weights)[0];
}

const RSS_FEEDS_LIST = [
    "https://www.theverge.com/rss/index.xml", 
    "https://hackaday.com/blog/feed/",
    "https://techcrunch.com/feed/"
];

export async function generateSchedule(clearExisting = false) {
    // 1. Load Strategy
    const { data: config } = await supabaseAdmin.from('pulse_config').select('*').single();
    if (!config) throw new Error("No Pulse Config found");

    if (clearExisting) {
        // Delete only PENDING jobs (preserve history)
        await supabaseAdmin.from('pulse_queue').delete().eq('status', 'PENDING');
    }

    // 2. Determine Start Time (UTC)
    // If we have pending jobs, start after the last one. If not, start now.
    let nextRun = new Date();
    
    // Explicitly use UTC milliseconds for calculation to avoid timezone drift
    const { data: lastJob } = await supabaseAdmin
        .from('pulse_queue')
        .select('scheduled_at')
        .eq('status', 'PENDING')
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .single();
    
    if (lastJob && !clearExisting) {
        nextRun = new Date(lastJob.scheduled_at);
    }

    // 3. Generate Job Tickets
    const articlesPerDay = config.articles_per_day || 12;
    // Calculate interval in milliseconds
    const intervalMs = (24 * 60 * 60 * 1000) / articlesPerDay;
    const queueItems = [];

    for (let i = 0; i < articlesPerDay; i++) {
        // Advance time by interval
        nextRun = new Date(nextRun.getTime() + intervalMs);

        const sourceMode = pickWeighted(config.source_weights);
        const imageSource = pickWeighted(config.image_weights);
        const region = pickWeighted(config.region_weights);
        const sentiment = pickWeighted(config.sentiment_weights);
        
        let jobParams: any = {
            target_region: region,
            article_sentiment: sentiment,
            word_count: 800,
            complexity: 'GENERAL',
            include_sidebar: true,
            generate_social: true
        };

        if (sourceMode === 'news_api_tailored') {
            const topic = config.topic_list && config.topic_list.length > 0 
                ? config.topic_list[Math.floor(Math.random() * config.topic_list.length)]
                : 'Technology';
            jobParams.mode = 'NEWS_API_AI';
            jobParams.config = { ...jobParams, news_mode: 'TAILORED', news_topic: topic };
        } 
        else if (sourceMode === 'news_api_automatic') {
            const cats = ['Technology', 'Business', 'Science', 'Politics'];
            const randomCat = cats[Math.floor(Math.random() * cats.length)];
            jobParams.mode = 'NEWS_API_AI';
            jobParams.config = { ...jobParams, news_mode: 'AUTOMATIC', news_category: randomCat };
        }
        else {
            const randomFeed = RSS_FEEDS_LIST[Math.floor(Math.random() * RSS_FEEDS_LIST.length)];
            jobParams.mode = 'SPECIFIC_RSS';
            jobParams.config = { ...jobParams, rss_url: randomFeed };
        }

        jobParams.config.preferred_image_source = imageSource; 

        queueItems.push({
            scheduled_at: nextRun.toISOString(), // Stores as absolute UTC string (e.g. 2024-01-01T10:00:00.000Z)
            status: 'PENDING',
            job_params: jobParams
        });
    }

    const { error: insertError } = await supabaseAdmin.from('pulse_queue').insert(queueItems);
    if (insertError) throw insertError;

    return queueItems.length;
}