const EVENT_REGISTRY_ENDPOINT = 'http://eventregistry.org/api/v1/minuteStreamArticles';

// Mapping Rusty Tablet Regions to Event Registry Location URIs
const REGION_MAP: Record<string, string> = {
  'US': 'http://en.wikipedia.org/wiki/United_States',
  'IN': 'http://en.wikipedia.org/wiki/India',
  'UK': 'http://en.wikipedia.org/wiki/United_Kingdom',
  'JP': 'http://en.wikipedia.org/wiki/Japan',
  'EU': 'http://en.wikipedia.org/wiki/Europe',
  'Global': '' // No location filter
};

// Mapping Categories to DMOZ Categories (Event Registry standard)
const CATEGORY_MAP: Record<string, string> = {
  'Business': 'dmoz/Business',
  'Technology': 'dmoz/Computers',
  'Science': 'dmoz/Science',
  'Health': 'dmoz/Health',
  'Politics': 'dmoz/Society/Politics',
  'Entertainment': 'dmoz/Arts/Entertainment',
  'Sports': 'dmoz/Sports'
};

interface NewsAPIOptions {
  mode: 'AUTOMATIC' | 'TAILORED';
  region?: string;
  category?: string;
  topic?: string;
}

export interface NewsResult {
  title: string;
  body: string;
  url: string;
  source: string;
  image?: string;
}

export async function fetchNewsContext(options: NewsAPIOptions): Promise<NewsResult | null> {
  const apiKey = process.env.NEWSAPI_AI_KEY;

  if (!apiKey) {
    console.error("❌ NEWSAPI_AI_KEY is missing.");
    return null;
  }

  // Base Body - Common settings
  const requestBody: any = {
    apiKey: apiKey,
    articleBodyLen: -1, // Full body
    includeArticleImage: true,
    includeArticleConcepts: true, // Helps with context
    includeSourceTitle: true,
    recentActivityArticlesMaxArticleCount: 50, // Limit to save tokens (1 token = 100 arts)
    // Filters
    lang: ["eng"],
    isDuplicateFilter: "skipDuplicates",
    hasBody: true 
  };

  // --- LOGIC BRANCHING ---

  if (options.mode === 'TAILORED' && options.topic) {
    // Strategy: Wide time window (48h) to find specific topic
    requestBody.recentActivityArticlesUpdatesAfterMinsAgo = 2880; 
    requestBody.keyword = options.topic;
    requestBody.keywordOper = "or";
    requestBody.keywordLoc = "title"; // Strict: Topic must be in title for relevance
  } 
  else {
    // Strategy: Narrow time window (24h) for general breaking news
    // Defaulting to AUTOMATIC behavior
    requestBody.recentActivityArticlesUpdatesAfterMinsAgo = 1440; // Last 24 hours
    
    // Apply Region Filter if specific
    if (options.region && REGION_MAP[options.region]) {
      requestBody.sourceLocationUri = [REGION_MAP[options.region]];
    }

    // Apply Category Filter
    if (options.category && CATEGORY_MAP[options.category]) {
      requestBody.categoryUri = [CATEGORY_MAP[options.category]];
    }
  }

  try {
    console.log(`📡 Calling Event Registry (${options.mode})...`);
    
    const response = await fetch(EVENT_REGISTRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error(`NewsAPI Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // The endpoint returns { recentActivityArticles: { activity: [...] } }
    const articles = data.recentActivityArticles?.activity;

    if (!articles || articles.length === 0) {
      console.warn("⚠️ NewsAPI found no articles in stream.");
      return null;
    }

    // Pick the most relevant article
    // For 'Stream', the first one is the newest. 
    // We can also sort by 'sim' (similarity) if we used keywords, but stream is time-based.
    // Let's pick the first valid one with a body.
    const article = articles[0];

    return {
      title: article.title,
      body: article.body,
      url: article.url,
      source: article.source?.title || 'News Wire',
      image: article.image
    };

  } catch (error) {
    console.error("NewsAPI Fetch Failed:", error);
    return null;
  }
}