// We are switching to native fetch to bypass SDK versioning issues
// No imports needed for standard fetch in Next.js

const API_KEY = process.env.GEMINI_API_KEY;
// Using the REST Endpoint directly ensures we hit the correct model
// Updated to 2.5-flash as discovered by user testing
const MODEL_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

interface AIArticleResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string; 
  authorName: string; 
}

export async function generateAIArticle(topic: string, language: string = 'en'): Promise<AIArticleResult> {
  console.log(`🤖 Ghost Writer generating article on: "${topic}" in ${language}...`);

  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  const prompt = `
    You are a senior journalist for "Rusty Tablet", a digital industrial newspaper.
    
    Task: Write a 800-1000 word article about: "${topic}".
    Language: ${language}
    Tone: Objective, analytical, slightly rustic/classic literary style. No emojis.
    
    Output Format: JSON only. Do not include markdown formatting blocks like \`\`\`json. Just the raw JSON object.
    
    JSON Structure:
    {
      "title": "Catchy newspaper headline",
      "slug": "url-friendly-kebab-case-string",
      "excerpt": "Two sentence summary.",
      "content": "Full article body in Markdown. Use ## for headers.",
      "authorName": "Select a fictional name suitable for this topic"
    }
  `;

  try {
    const response = await fetch(`${MODEL_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract the text from the nested JSON response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No content generated from Gemini");
    }

    // Clean up markdown blocks if present
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedResult = JSON.parse(cleanedJson);

    // --- VALIDATION LAYER ---
    // Ensure critical fields exist to prevent DB crashes
    if (!parsedResult.authorName) {
      console.warn("⚠️ AI missing authorName, using fallback.");
      parsedResult.authorName = "Rusty Tablet Staff";
    }
    if (!parsedResult.title) parsedResult.title = "Untitled Report";
    if (!parsedResult.slug) parsedResult.slug = `article-${Date.now()}`;
    
    return parsedResult as AIArticleResult;

  } catch (error) {
    console.error("❌ Gemini Generation Error:", error);
    throw error;
  }
}