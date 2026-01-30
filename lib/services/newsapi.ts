const BASE_URL = 'http://eventregistry.org/api/v1';

interface NewsAPIOptions {
  // Mode Selection
  mode: 'TARGETED' | 'DEEP_DIVE' | 'BREAKING';
  
  // Targeted / Deep Dive Params
  keyword?: string;
  categoryUri?: string;
  locationUri?: string;
  conceptUri?: string;
  
  // Sorting & Filters
  sortFocus?: 'RELEVANCE' | 'IMPORTANCE' | 'VIRALITY' | 'DATE';
  ignoreSource?: string[];
  dateStart?: string;
}

export interface NewsResult {
  title: string;
  body: string;
  url?: string;
  source: string;
  image?: string;
  date: string;
  is_event_summary?: boolean;
}

// Helper to map our Sort enums to Event Registry API values
const getSortBy = (focus?: string) => {
  switch (focus) {
    case 'IMPORTANCE': return 'sourceImportance';
    case 'VIRALITY': return 'socialScore';
    case 'RELEVANCE': return 'rel';
    default: return 'date';
  }
};

export async function fetchNewsContext(options: NewsAPIOptions): Promise<NewsResult | null> {
  const apiKey = process.env.NEWSAPI_AI_KEY;
  if (!apiKey) {
    console.error("❌ NEWSAPI_AI_KEY is missing.");
    return null;
  }

  try {
    console.log(`[NewsAPI] Fetching in mode: ${options.mode}`);

    // --- MODE C: BREAKING (Minute Stream) ---
    if (options.mode === 'BREAKING') {
      const response = await fetch(`${BASE_URL}/minuteStreamArticles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          recentActivityArticlesMaxArticleCount: 50,
          recentActivityArticlesUpdatesAfterMinsAgo: 60, // Last hour
          articleBodyLen: -1,
          includeArticleImage: true,
          lang: ["eng"],
          // Optional Filters if provided
          categoryUri: options.categoryUri ? [options.categoryUri] : undefined,
          sourceLocationUri: options.locationUri ? [options.locationUri] : undefined
        })
      });
      
      const data = await response.json();
      const article = data.recentActivityArticles?.activity?.[0];
      
      if (!article) return null;
      
      return {
        title: article.title,
        body: article.body,
        url: article.url,
        source: article.source?.title || 'Breaking Wire',
        image: article.image,
        date: article.dateTimePub
      };
    }

    // --- MODE B: DEEP-DIVE (Events Cluster) ---
    if (options.mode === 'DEEP_DIVE') {
      const response = await fetch(`${BASE_URL}/event/getEvents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          resultType: "events",
          eventsSortBy: options.sortFocus === 'VIRALITY' ? 'socialScore' : 'size', // Default to size/importance
          eventsCount: 1,
          // Filters
          keyword: options.keyword,
          conceptUri: options.conceptUri ? [options.conceptUri] : undefined,
          categoryUri: options.categoryUri ? [options.categoryUri] : undefined,
          locationUri: options.locationUri ? [options.locationUri] : undefined,
          lang: ["eng"],
          forceMaxDataTimeWindow: 31
        })
      });

      const data = await response.json();
      const event = data.events?.results?.[0];

      if (!event) return null;

      // Construct context from event metadata
      const summary = event.summary?.eng || event.title?.eng || "No summary available.";
      
      return {
        title: event.title?.eng || "Major Event",
        body: `EVENT SUMMARY: ${summary}\n\nTOPIC: ${options.keyword || options.categoryUri || 'Global News'}`,
        source: 'Global News Cluster',
        image: event.images?.[0] || null,
        date: event.eventDate,
        is_event_summary: true
      };
    }

    // --- MODE A: TARGETED (Get Articles) ---
    if (options.mode === 'TARGETED') {
      const response = await fetch(`${BASE_URL}/article/getArticles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          resultType: "articles",
          articlesCount: 1,
          articlesSortBy: getSortBy(options.sortFocus),
          articleBodyLen: -1, // Full body
          includeArticleImage: true,
          // Filters
          keyword: options.keyword,
          conceptUri: options.conceptUri ? [options.conceptUri] : undefined,
          categoryUri: options.categoryUri ? [options.categoryUri] : undefined,
          sourceLocationUri: options.locationUri ? [options.locationUri] : undefined,
          ignoreSourceUri: options.ignoreSource,
          dateStart: options.dateStart,
          lang: ["eng"],
          forceMaxDataTimeWindow: 31
        })
      });

      const data = await response.json();
      const article = data.articles?.results?.[0];

      if (!article) return null;

      return {
        title: article.title,
        body: article.body,
        url: article.url,
        source: article.source?.title || 'News Source',
        image: article.image,
        date: article.dateTimePub
      };
    }

    return null;

  } catch (error) {
    console.error("NewsAPI Fetch Failed:", error);
    return null;
  }
}

// --- UTILITY FUNCTIONS (For Hydration) ---

export async function suggestCategories(label: string) {
  const apiKey = process.env.NEWSAPI_AI_KEY;
  if (!apiKey) return [];
  
  try {
    const res = await fetch(`${BASE_URL}/suggestCategoriesFast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, prefix: label })
    });
    const data = await res.json();
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function suggestLocations(label: string) {
  const apiKey = process.env.NEWSAPI_AI_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${BASE_URL}/suggestLocationsFast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, prefix: label, count: 10, lang: "eng" })
    });
    const data = await res.json();
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function suggestConcepts(label: string) {
    const apiKey = process.env.NEWSAPI_AI_KEY;
    if (!apiKey) return [];
  
    try {
      const res = await fetch(`${BASE_URL}/suggestConceptsFast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, prefix: label, lang: "eng" })
      });
      const data = await res.json();
      return data || [];
    } catch (e) {
      return [];
    }
  }