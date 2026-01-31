import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- RESEND INITIALIZATION (Lazy) ---
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
      console.error("CRITICAL: RESEND_API_KEY is missing in environment variables.");
      return NextResponse.json({ error: 'Server Config Error: Missing Email Key' }, { status: 500 });
  }
  const resend = new Resend(resendApiKey);

  try {
    const { subject, htmlContent, testMode } = await req.json();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // 1. Fetch Subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('email');

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers found.' });
    }

    // 2. Prepare Recipient List
    // IMPORTANT: Resend Free Tier limit is 100 emails/day.
    // For large lists in prod, you would batch this or use a loop.
    
    // In Test Mode, send to admin only. Replace this string with your real admin email if needed.
    const recipients = testMode 
      ? ['admin@rustytablet.com'] 
      : subscribers.map(s => s.email);

    // 3. Send via Resend
    // We use 'bcc' to hide recipient list from each other.
    const { data, error } = await resend.emails.send({
      from: 'Rusty Tablet <editor@rustytablet.com>', // Ensure domain verified in Resend
      to: ['subscribers@rustytablet.com'], // Dummy TO address
      bcc: recipients,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      throw new Error(error.message);
    }

    return NextResponse.json({ 
      success: true, 
      count: recipients.length, 
      id: data?.id 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}