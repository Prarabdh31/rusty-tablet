const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

// Curated fallback images
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1200&q=80", 
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
  "https://images.unsplash.com/photo-1565610222536-ef125c59da2c?w=1200&q=80",
  "https://images.unsplash.com/photo-1529101091760-61df51603096?w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80" 
];

export async function getUnsplashImage(query: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    console.error("❌ UNSPLASH_ACCESS_KEY is missing in environment variables.");
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        },
        next: { revalidate: 3600 } // Cache for 1 hour to save API calls
      }
    );

    if (!response.ok) {
      // Log the exact error for Vercel Runtime Logs
      const errorText = await response.text();
      console.error(`❌ Unsplash API Error (${response.status}): ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    
    console.warn(`⚠️ Unsplash found 0 images for query: "${query}"`);
    return null;

  } catch (error) {
    console.error("❌ Unsplash Fetch Failed (Network/System):", error);
    return null;
  }
}

export function getFallbackImage(): string {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}