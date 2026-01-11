const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

// Curated fallback images
export const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1200&q=80", 
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
  "https://images.unsplash.com/photo-1565610222536-ef125c59da2c?w=1200&q=80",
  "https://images.unsplash.com/photo-1529101091760-61df51603096?w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80" 
];

export function getFallbackImage(): string {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

// 1. Fetch Buffer (For Backend/Storage)
export async function getUnsplashImageBuffer(query: string): Promise<{ buffer: ArrayBuffer, credit: string } | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    console.warn("⚠️ UNSPLASH_ACCESS_KEY missing.");
    return null;
  }

  try {
    const searchResponse = await fetch(
      `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { 'Authorization': `Client-ID ${apiKey}` } }
    );

    if (!searchResponse.ok) return null;

    const data = await searchResponse.json();
    const photo = data.results?.[0];

    if (!photo) return null;

    const imageResponse = await fetch(photo.urls.regular);
    if (!imageResponse.ok) return null;

    const buffer = await imageResponse.arrayBuffer();
    const credit = `Photo by ${photo.user.name} on Unsplash`;

    return { buffer, credit };

  } catch (error) {
    console.error("Unsplash Download Failed:", error);
    return null;
  }
}

// 2. Fetch URL (For Frontend/Inline Display)
export async function getUnsplashImage(query: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    // Return null so caller uses fallback
    return null; 
  }

  try {
    const response = await fetch(
      `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      {
        headers: { 'Authorization': `Client-ID ${apiKey}` },
        next: { revalidate: 3600 } 
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    
    return null;

  } catch (error) {
    console.error("Unsplash URL Fetch Failed:", error);
    return null;
  }
}