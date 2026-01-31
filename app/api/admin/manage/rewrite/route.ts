import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, instructions } = await req.json();

    if (!content || !instructions) {
      return NextResponse.json({ error: 'Missing content or instructions' }, { status: 400 });
    }

    const prompt = `
      You are a senior editor for "Rusty Tablet".
      
      TASK: Rewrite the following article section based on the specific instructions provided.
      
      INSTRUCTIONS:
      "${instructions}"
      
      ORIGINAL CONTENT:
      "${content}"
      
      OUTPUT:
      Return ONLY the rewritten markdown text. Do not include "Here is the rewritten text" or markdown fences. Keep the tone industrial, analytical, and sharp.
    `;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const rewrittenText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rewrittenText) throw new Error("AI returned no text");

    return NextResponse.json({ success: true, rewritten: rewrittenText });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}