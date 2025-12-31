import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; 
import { generateAIArticle } from '@/lib/ai/generator';

const TOPICS = [
  "The resurgence of analog synthesizers in modern industrial music",
  "Why brutalist architecture is making a comeback in corporate HQs",
  "The hidden economy of mechanical watch repair",
  "Digital fatigue: Why executives are switching to dumb phones",
  "The environmental cost of cloud computing centers",
  "Rust belt revival: How old factories are becoming server farms",
  "The lost art of letterpress printing",
  "Cobol developers: The highest paid ghosts in the machine"
];

// Curated Unsplash Images for "Rusty Tablet" aesthetic
const STOCK_IMAGES: Record<string, string> = {
  "watch": "https://images.unsplash.com/photo-1524514587686-e580a4f69f97?w=1200&q=80",
  "analog": "https://images.unsplash.com/photo-1563293883-93666f77341b?w=1200&q=80",
  "brutalist": "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1200&q=80",
  "architecture": "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&q=80",
  "phone": "https://images.unsplash.com/photo-1556656793-02757d92f28e?w=1200&q=80",
  "cloud": "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?w=1200&q=80",
  "server": "https://images.unsplash.com/photo-1558494949-ef526b0042a0?w=1200&q=80",
  "rust": "https://images.unsplash.com/photo-1518364538800-6bae3c2db092?w=1200&q=80",
  "factory": "https://images.unsplash.com/photo-1565610222536-ef125c59da2c?w=1200&q=80",
  "print": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80",
  "cobol": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80"
};

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80", // Tech
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80", // Work
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80"  // Cyber
];

function getRelevantImage(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  
  // 1. Try to match a keyword
  for (const [key, url] of Object.entries(STOCK_IMAGES)) {
    if (lowerTopic.includes(key)) return url;
  }
  
  // 2. Fallback to random default
  return DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
}

export async function GET(req: NextRequest) {
  // 0. Check Server Configuration
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Server Misconfiguration: CRON_SECRET not set' }, { status: 500 });
  }

  // 1. Secure this endpoint
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Initialize Admin Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server Misconfiguration: Missing Supabase Keys' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const article = await generateAIArticle(topic);
    
    // --- NEW: Select Image ---
    const imageUrl = getRelevantImage(topic);

    let authorId;
    const { data: existingAuthor } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('name', article.authorName)
      .single();

    if (existingAuthor) {
      authorId = existingAuthor.id;
    } else {
      const { data: newAuthor, error: authorError } = await supabaseAdmin
        .from('authors')
        .insert({
          name: article.authorName,
          role: 'AI Correspondent',
          is_ai: true,
          bio: 'An automated observer of the digital age.'
        })
        .select()
        .single();
      
      if (authorError) throw authorError;
      authorId = newAuthor.id;
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        author_id: authorId,
        is_published: true,
        category: 'Technology',
        language: 'en',
        featured_image: imageUrl // <--- Saving the image to DB
      })
      .select()
      .single();

    if (postError) throw postError;
    
    return NextResponse.json({ 
      success: true, 
      message: `Published: ${article.title}`,
      post_id: post.id 
    });

  } catch (error: any) {
    console.error('Ghost Writer Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}