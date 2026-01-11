import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRSSFeed, RSSItem } from '@/lib/services/rss';
import { fetchNewsContext } from '@/lib/services/newsapi';
import { generateImagenBuffer } from '@/lib/services/imagen';
import { getUnsplashImageBuffer } from '@/lib/services/unsplash';
import { uploadImageToStorage } from '@/lib/services/storage';

// --- CONFIGURATION ---
const GEMINI_TEXT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// --- TYPES ---
type Mode = 'SPECIFIC_RSS' | 'MANUAL' | 'NEWS_API_AI';

interface RequestBody {
  mode: Mode;
  config: {
    rss_url?: string;
    content_input?: string; 
    topic_search?: string; 
    
    // NewsAPI Specifics
    news_mode?: 'AUTOMATIC' | 'TAILORED';
    news_category?: string;
    news_topic?: string;

    target_region?: string;        
    article_sentiment?: string;    
    complexity?: 'EASY' | 'GENERAL' | 'TECHNICAL'; 
    
    word_count?: number; 
    layout_instructions?: string; 
    
    include_sidebar?: boolean;     
    generate_social?: boolean;     
  };
}

interface VisualPlanItem {
  id: string; // "VISUAL_1", "VISUAL_2", or "FEATURED"
  type: 'FEATURED' | 'INLINE';
  prompt: string; // Detailed prompt for Imagen
  search_keyword: string; // Backup keyword for Unsplash
  caption: string;
  style: 'PHOTOREALISTIC' | 'ILLUSTRATION' | 'INFOGRAPHIC';
}

// --- HELPER: FETCH EXTERNAL IMAGE BUFFER ---
async function fetchExternalImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("Failed to fetch external image:", url, e);
    return null;
  }
}

// --- HELPER: GEMINI TEXT GENERATION ---
async function generateArticleText(
  context: string, 
  config: RequestBody['config'],
  retryCount = 0
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Defaults
  const wordCount = config.word_count || 800;
  const region = config.target_region || 'Global';
  const sentiment = config.article_sentiment || 'Objective';
  const complexity = config.complexity || 'GENERAL';

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
    "${context.substring(0, 20000)}" 
    
    CONFIGURATION:
    - Region/Persona: ${region}
    - Word Count: ~${wordCount} words
    - Sentiment: ${sentiment}
    - Reading Level: ${complexity}
    
    INSTRUCTIONS:
    1. **Visual Director Mode:** You must plan the visual assets. 
       - Always include 1 "FEATURED" image.
       - Include 1-2 "INLINE" images where relevant in the body.
       - Insert placeholders like [VISUAL_1], [VISUAL_2] in the markdown content where inline images should appear.
    2. **Writing:** Write the article following the "Rusty Tablet" industrial/analytical tone.
    3. **Metadata:** Generate headlines, nut graph, sidebar, and social posts.
    
    LAYOUT INSTRUCTIONS:
    ${layout}
    
    Output Format: JSON ONLY.
    
    JSON SCHEMA:
    {
      "author_name": "String",
      "author_role": "String",
      "title": "String",
      "alt_headlines": ["String", "String", "String"],
      "slug": "kebab-case-string",
      "category": "String (Single Word)",
      "excerpt": "String (2 sentences)",
      "nut_graph": "String",
      "content": "Markdown String (With [VISUAL_1] placeholders)",
      "sidebar_content": { "title": "String", "items": ["String"] },
      "meta_description": "String",
      "social_text": "String",
      "visual_plan": [
        {
          "id": "FEATURED",
          "type": "FEATURED",
          "prompt": "Detailed prompt for AI image generator (Cinematic, Industrial)",
          "search_keyword": "2-3 word query for Unsplash fallback",
          "caption": "Journalistic caption",
          "style": "PHOTOREALISTIC" 
        },
        {
          "id": "VISUAL_1",
          "type": "INLINE",
          "prompt": "Detailed prompt for AI image generator",
          "search_keyword": "Fallback query",
          "caption": "Journalistic caption",
          "style": "PHOTOREALISTIC"
        }
      ],
      "chart_data": {
        "type": "BAR" | "PIE" | "LINE",
        "title": "String",
        "data": [ { "label": "String", "value": Number } ]
      } | null
    }
  `;

  try {
    const response = await fetch(`${GEMINI_TEXT_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ]
      })
    });

    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
        if (retryCount < 1) return generateArticleText(context, config, retryCount + 1);
        throw new Error("Gemini produced no text");
    }

    return JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error: any) {
    console.error("Gemini Generation Failed:", error);
    throw new Error(`Failed to generate article: ${error.message}`);
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
    let newsApiImage: string | null = null;

    // 1. DATA INGESTION
    if (mode === 'MANUAL') {
      if (!config.content_input) throw new Error("Content input required for Manual mode");
      contextData = config.content_input;
      sourceUrl = "Manual Input";
    } 
    else if (mode === 'SPECIFIC_RSS') {
      if (!config.rss_url) throw new Error("RSS URL required");
      let items = await fetchRSSFeed(config.rss_url, 15);
      if (config.topic_search) {
        const term = config.topic_search.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(term) || i.contentSnippet?.toLowerCase().includes(term));
      }
      if (items.length === 0) throw new Error("No RSS items found");
      const randomItem = items[Math.floor(Math.random() * items.length)];
      contextData = `Headline: ${randomItem.title}. Snippet: ${randomItem.contentSnippet}`;
      sourceUrl = randomItem.link;
    }
    else if (mode === 'NEWS_API_AI') {
      const newsResult = await fetchNewsContext({
        mode: config.news_mode || 'AUTOMATIC',
        region: config.target_region,
        category: config.news_category,
        topic: config.news_topic
      });
      if (!newsResult) throw new Error("NewsAPI failed to find articles.");
      contextData = `Headline: ${newsResult.title}\n\nBody:\n${newsResult.body}`;
      sourceUrl = newsResult.url;
      if (newsResult.image) newsApiImage = newsResult.image;
    }
    else {
      throw new Error("Invalid Mode selected");
    }

    // 2. GENERATION
    const articleData = await generateArticleText(contextData, config);

    // 3. ASSET PIPELINE (The "Visual Director" Execution)
    const visualPlan = articleData.visual_plan || [];
    let finalContent = articleData.content;
    let featuredImageUrl: string | null = null;
    const processedImages: any[] = [];

    // Helper to upload and record image
    const saveImageAsset = async (buffer: Buffer, filename: string, meta: any) => {
       const upload = await uploadImageToStorage(buffer, filename);
       if (upload) {
          processedImages.push({ ...meta, public_url: upload.publicUrl, storage_path: upload.path });
          return upload.publicUrl;
       }
       return null;
    };

    // Iterate through visual plan
    for (const item of visualPlan) {
      try {
        let buffer: Buffer | null = null;
        let source = '';
        let credit = '';

        // Strategy A: Use NewsAPI Image (Only for Featured)
        if (item.type === 'FEATURED' && newsApiImage) {
          console.log(`[Asset] Using NewsAPI Source Image for Featured`);
          const newsBuffer = await fetchExternalImageBuffer(newsApiImage);
          if (newsBuffer) {
             buffer = newsBuffer;
             source = 'NEWS_SOURCE';
             credit = 'Source Media via NewsAPI';
          }
        }

        // Strategy B: Gemini Imagen (If no buffer yet)
        if (!buffer) {
           console.log(`[Asset] Generating with Imagen: ${item.prompt.substring(0, 30)}...`);
           buffer = await generateImagenBuffer(item.prompt);
           if (buffer) {
             source = 'GEMINI_IMAGEN';
             credit = 'Illustration by Rusty Tablet AI';
           }
        }

        // Strategy C: Unsplash Fallback (If no buffer yet)
        if (!buffer && item.search_keyword) {
           console.log(`[Asset] Fallback to Unsplash: ${item.search_keyword}`);
           const unsplashData = await getUnsplashImageBuffer(item.search_keyword);
           if (unsplashData) {
             buffer = Buffer.from(unsplashData.buffer); // Ensure Buffer type
             source = 'UNSPLASH';
             credit = unsplashData.credit;
           }
        }

        // Upload & Record
        if (buffer) {
          const filename = `${item.id.toLowerCase()}_${Date.now()}.png`;
          const publicUrl = await saveImageAsset(buffer, filename, {
             alt_text: item.prompt,
             caption: item.caption,
             source,
             credit,
             usage_type: item.type
          });

          if (publicUrl) {
            if (item.type === 'FEATURED') {
              featuredImageUrl = publicUrl;
            } else {
              // Replace placeholder in text: [VISUAL_1] -> ![Alt](Url)
              const markdownImage = `\n\n![${item.caption}](${publicUrl} "${item.caption} | ${credit}")\n\n`;
              finalContent = finalContent.replace(`[${item.id}]`, markdownImage);
            }
          }
        } else {
          // If all failed, remove placeholder cleanly
          finalContent = finalContent.replace(`[${item.id}]`, '');
        }

      } catch (err) {
        console.error(`Failed to process visual item ${item.id}:`, err);
        finalContent = finalContent.replace(`[${item.id}]`, ''); // Cleanup on error
      }
    }

    // 4. DATABASE SAVING
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Author
    const generatedAuthorName = articleData.author_name || 'Rusty Tablet Staff';
    let authorId;
    const { data: existingAuthor } = await supabaseAdmin.from('authors').select('id').eq('name', generatedAuthorName).single();
    
    if (existingAuthor) authorId = existingAuthor.id;
    else {
      const { data: newAuthor } = await supabaseAdmin.from('authors').insert({
        name: generatedAuthorName, role: articleData.author_role, is_ai: true, bio: `Reporting from ${config.target_region}.`
      }).select().single();
      authorId = newAuthor?.id;
    }

    // Save Post
    const { data: post, error: dbError } = await supabaseAdmin.from('posts').insert({
      title: articleData.title,
      slug: articleData.slug + '-' + Date.now().toString().slice(-4),
      excerpt: articleData.excerpt,
      content: finalContent, // Now contains real image URLs
      author_id: authorId,
      is_published: true,
      category: articleData.category || 'Dispatches', 
      language: 'en',
      featured_image: featuredImageUrl, // The uploaded URL
      source_url: sourceUrl,
      generation_mode: mode,
      nut_graph: articleData.nut_graph,
      sidebar_content: articleData.sidebar_content,
      meta_description: articleData.meta_description,
      social_text: articleData.social_text,
      alt_headlines: articleData.alt_headlines,
      chart_data: articleData.chart_data
    }).select().single();

    if (dbError) throw dbError;

    // Save Image Metadata (Bulk insert)
    if (processedImages.length > 0 && post) {
      const imageRecords = processedImages.map(img => ({
        post_id: post.id,
        storage_path: img.storage_path,
        public_url: img.public_url,
        alt_text: img.alt_text,
        caption: img.caption,
        source: img.source,
        credit: img.credit,
        usage_type: img.usage_type
      }));
      await supabaseAdmin.from('article_images').insert(imageRecords);
    }

    return NextResponse.json({ 
      success: true, 
      post_id: post.id, 
      title: post.title, 
      images_processed: processedImages.length
    });

  } catch (error: any) {
    console.error("Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}