const API_KEY = process.env.GEMINI_API_KEY;
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;

// Expanded fallback images covering Politics, Culture, News, and Tech
const FALLBACK_IMAGES = [
  // Politics & Global
  "https://images.unsplash.com/photo-1529101091760-61df51603096?w=1200&q=80", // Government Building
  "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=1200&q=80", // Newspaper Press
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80", // Global Connections
  
  // Culture & Society
  "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&q=80", // Library/Education
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80", // Public Crowd
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80", // Digital Screen/Social
  
  // Industry & Tech (Keeping some)
  "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1200&q=80", // Brutalist Building
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80", // Circuit Board
  "https://images.unsplash.com/photo-1565610222536-ef125c59da2c?w=1200&q=80", // Factory Smoke
  
  // Nature & Environment
  "https://images.unsplash.com/photo-1500964757637-c85e8a1605c2?w=1200&q=80", // Clouds/Sky
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80"  // Landscape
];

export async function generateImagenImage(prompt: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn("⚠️ Missing GEMINI_API_KEY, using fallback image.");
    return getRandomFallback();
  }

  // UPDATED PROMPT: Removed "Industrial" constraint. 
  // Now focuses on high-quality editorial/journalistic style suitable for any topic.
  const refinedPrompt = `Editorial photography, cinematic lighting, high resolution, 8k, photorealistic: ${prompt}. Professional news imagery.`;

  try {
    const response = await fetch(`${IMAGEN_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: refinedPrompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn("⚠️ Imagen API Error (Likely Billing/Tier):", err.error?.message || response.status);
      console.warn("🔄 Switching to Fallback Image System");
      return getRandomFallback();
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) return getRandomFallback();

    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error("Imagen Generation Failed, using fallback:", error);
    return getRandomFallback();
  }
}

function getRandomFallback(): string {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}