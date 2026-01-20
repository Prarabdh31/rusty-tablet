import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Basic Validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .insert({ name, email, subject, message });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Message sent successfully.' });

  } catch (error: any) {
    console.error('Contact Form Error:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}