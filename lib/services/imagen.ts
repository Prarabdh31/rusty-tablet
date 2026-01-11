const API_KEY = process.env.GEMINI_API_KEY;
// Updated to Imagen 4.0 (3.0 often returns 404/deprecated)
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;

export async function generateImagenBuffer(prompt: string): Promise<Buffer | null> {
  if (!API_KEY) {
    console.warn("⚠️ Missing GEMINI_API_KEY");
    return null;
  }

  // Enforce the "Rusty Tablet" aesthetic in the prompt
  const refinedPrompt = `Photorealistic, cinematic, high contrast, industrial journalism style: ${prompt}. 8k resolution, highly detailed.`;

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
      // FIX: Read error as text first to avoid JSON parse errors on empty responses
      const errorText = await response.text();
      console.warn(`Imagen API Error (${response.status}):`, errorText.substring(0, 200) || "No error details returned");
      return null;
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) return null;

    // Convert Base64 string to Buffer
    return Buffer.from(base64Image, 'base64');

  } catch (error) {
    console.error("Imagen Generation Failed:", error);
    return null;
  }
}