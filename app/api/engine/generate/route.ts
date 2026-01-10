import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRSSFeed } from '@/lib/services/rss';
import { getUnsplashImage, getFallbackImage } from '@/lib/services/unsplash';

// --- CONFIGURATION ---
const GEMINI_TEXT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

// --- TYPES ---
type Mode = 'SPECIFIC_RSS' | 'MANUAL';

interface RequestBody {
  mode: Mode;
  config: {
    // Data Source Params
    rss_url?: string;
    content_input?: string; 
    topic_search?: string; 
    
    // Identity & Tone Params
    target_region?: string;        // e.g., "US", "Global", "Mars Colony"
    article_sentiment?: string;    // e.g., "Cynical", "Optimistic", "Investigative"
    complexity?: 'EASY' | 'GENERAL' | 'TECHNICAL'; // NEW: Reading Level
    
    // Structure Params
    word_count?: number; 
    layout_instructions?: string; 
    
    // Tabloid Features (Toggles)
    include_sidebar?: boolean;     // "Fast Facts" box
    generate_social?: boolean;     // Tweets/SEO
  };
}

// --- HELPER: GEMINI TEXT GENERATION ---
async function generateArticleText(
  context: string, 
  config: RequestBody['config']
) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Defaults
  const wordCount = config.word_count || 800;
  const region = config.target_region || 'Global';
  const sentiment = config.article_sentiment || 'Objective';
  const complexity = config.complexity || 'GENERAL';

  // Layout Logic
  const defaultLayout = `
    - Start with a "Nut Graph" (Why this matters).
    - Use a "Key Takeaways" bullet list.
    - Main Analysis (Broken into subsections).
    - "Public Sentiment" section (Synthesized quotes).
    - Conclusion.
  `;
  const layout = config.layout_instructions || defaultLayout;

  const prompt = `
    You are a senior editor for "Rusty Tablet", a prestigious digital newspaper.
    
    SOURCE CONTEXT:
    "${context.substring(0, 10000)}" // Truncate to prevent token overflow
    
    CONFIGURATION:
    - Region/Persona: ${region}
    - Word Count: ~${wordCount} words
    - Sentiment: ${sentiment}
    - Reading Level: ${complexity} (EASY = Grade 8, GENERAL = NYT Style, TECHNICAL = Academic)
    
    MANDATORY INSTRUCTIONS (THE TABLOID METHOD):
    1. **Persona:** Create a fictional Author Name & Role based on the Region.
    2. **Headlines:** Generate a main headline that is catchy/viral but accurate (Easily understandable English). Also generate 3 alternative headlines.
    3. **Nut Graph:** Explicitly write a "Why it matters" paragraph explaining the impact of this story.
    4. **Public Sentiment:** Synthesize a realistic "Public Reaction" or Quote based on typical discourse on this topic (do not hallucinate specific real people, summarize the mood).
    5. **Sidebar:** Create a "Fast Facts" or "Timeline" sidebar box content.
    6. **SEO/Social:** Write a Google Meta Description and a Viral Tweet.
    7. **Visuals:** - **Inline Images:** Insert exactly 2 placeholders in the markdown body where an image would be relevant. Format: [IMAGE: keyword for unsplash search].
       - **Data Chart:** Analyze the context. If numerical data exists (percentages, years, comparisons), generate a JSON object for a chart (Bar, Line, or Pie). If no data, return null for chart.
    
    LAYOUT INSTRUCTIONS:
    ${layout}
    
    Output Format: JSON ONLY.
    
    JSON SCHEMA:
    {
      "author_name": "String",
      "author_role": "String",
      "title": "String (Main Headline)",
      "alt_headlines": ["String", "String", "String"],
      "slug": "kebab-case-string",
      "category": "String (Single Word Only, No slashes, e.g. 'Politics', 'Technology')",
      "excerpt": "String (2 sentences)",
      "nut_graph": "String (Why it matters)",
      "content": "Markdown String (The main article body with [IMAGE: keyword] placeholders)",
      "sidebar_content": {
        "title": "String (e.g., 'Fast Facts')",
        "items": ["String", "String", "String"]
      },
      "meta_description": "String (SEO)",
      "social_text": "String (Viral Post)",
      "image_keywords": "String (Unsplash search query for Cover Image)",
      "chart_data": {
        "type": "BAR" | "PIE" | "LINE",
        "title": "String",
        "data": [
          { "label": "String", "value": Number }
        ]
      } | null
    }
  `;

  const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // FORCE JSON MODE: This ensures the API returns valid JSON and fixes the parsing errors
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini produced no text");

  const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("JSON Parsing Failed. Raw Text:", rawText);
    throw new Error("Failed to parse AI response as JSON");
  }
}

// --- MAIN ROUTE HANDLER ---
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: RequestBody = await req.json();
    const { mode, config } = body;
    
    let contextData = "";
    let sourceUrl = "";

    // 1. DATA INGESTION
    if (mode === 'MANUAL') {
      if (!config.content_input) throw new Error("Content input required for Manual mode");
      contextData = config.content_input;
      sourceUrl = "Manual Input";
    } 
    else if (mode === 'SPECIFIC_RSS') {
      if (!config.rss_url) throw new Error("RSS URL required");
      
      let items = await fetchRSSFeed(config.rss_url, 15);
      
      // Filter by Topic
      if (config.topic_search) {
        const term = config.topic_search.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(term) || i.contentSnippet?.toLowerCase().includes(term));
      }

      if (items.length === 0) throw new Error("No RSS items found matching criteria");
      
      const randomItem = items[Math.floor(Math.random() * items.length)];
      contextData = `Headline: ${randomItem.title}. Snippet: ${randomItem.contentSnippet}`;
      sourceUrl = randomItem.link;
    }
    else {
      throw new Error("Invalid Mode selected");
    }

    // 2. GENERATION (The Heavy Lifting)
    const articleData = await generateArticleText(contextData, config);

    // 3. VISUALS
    let featuredImage: string | null = null;
    if (articleData.image_keywords) {
        console.log(`Searching Unsplash for: ${articleData.image_keywords}`);
        featuredImage = await getUnsplashImage(articleData.image_keywords);
    }
    if (!featuredImage) {
        console.warn("Unsplash failed/empty, using static fallback.");
        featuredImage = getFallbackImage();
    }

    // 4. DATABASE SAVING (Using new columns)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Author Management
    const generatedAuthorName = articleData.author_name || 'Rusty Tablet Staff';
    const generatedAuthorRole = articleData.author_role || 'Contributor';
    
    let authorId;
    const { data: existingAuthor } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('name', generatedAuthorName)
      .single();
    
    if (existingAuthor) {
      authorId = existingAuthor.id;
    } else {
      const { data: newAuthor } = await supabaseAdmin.from('authors').insert({
        name: generatedAuthorName, 
        role: generatedAuthorRole, 
        is_ai: true,
        bio: `Reporting from ${config.target_region || 'Global'}.`
      }).select().single();
      authorId = newAuthor?.id;
    }

    const { data: post, error: dbError } = await supabaseAdmin.from('posts').insert({
      title: articleData.title,
      slug: articleData.slug + '-' + Date.now().toString().slice(-4),
      excerpt: articleData.excerpt,
      content: articleData.content,
      author_id: authorId,
      is_published: true,
      category: articleData.category || 'Dispatches', 
      language: 'en',
      featured_image: featuredImage,
      source_url: sourceUrl,
      generation_mode: mode,
      // --- NEW TABLOID DATA ---
      nut_graph: articleData.nut_graph,
      sidebar_content: articleData.sidebar_content, // Saves as JSONB
      meta_description: articleData.meta_description,
      social_text: articleData.social_text,
      alt_headlines: articleData.alt_headlines,
      // --- INFOGRAPHICS ---
      chart_data: articleData.chart_data // Stores the chart config
    }).select().single();

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      post_id: post.id, 
      title: post.title, 
      author: generatedAuthorName,
      category: articleData.category,
      has_chart: !!articleData.chart_data,
      tabloid_features: {
        has_sidebar: !!articleData.sidebar_content,
        has_social: !!articleData.social_text
      }
    });

  } catch (error: any) {
    console.error("Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}