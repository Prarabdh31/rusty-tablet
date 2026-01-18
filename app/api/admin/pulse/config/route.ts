import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Secure Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Retrieve the current strategy
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the single config row (or the first one)
    const { data, error } = await supabaseAdmin
      .from('pulse_config')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, config: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update the strategy
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await req.json();
    
    // We assume there is only 1 row, so we update all rows (effectively the singleton)
    // or we could fetch the ID first. A simple way for a singleton table:
    const { data, error } = await supabaseAdmin
      .from('pulse_config')
      .update(updates)
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update everything not nil (aka all rows)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, config: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}