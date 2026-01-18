import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing Job ID' }, { status: 400 });

    // 1. Fetch & Lock Job
    // We check status to prevent double-run
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('pulse_queue')
      .select('*')
      .eq('id', id)
      .eq('status', 'PENDING') // Critical: Only run if still pending
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found or already processing' }, { status: 404 });
    }

    // 2. Mark Processing
    await supabaseAdmin.from('pulse_queue').update({ status: 'PROCESSING' }).eq('id', id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    try {
      // 3. Execute
      console.log(`[Pulse Manual] Executing Job ${id}`);
      
      const response = await fetch(`${siteUrl}/api/engine/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify(job.job_params)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Phantom Engine failed');
      }

      // 4. Success: Update Queue & Log
      await supabaseAdmin.from('pulse_queue').update({ status: 'COMPLETED' }).eq('id', id);
      
      await supabaseAdmin.from('pulse_logs').insert({
        queue_id: id,
        status: 'SUCCESS',
        result_summary: { 
           title: result.title,
           post_id: result.post_id 
        }
      });

      return NextResponse.json({ success: true, result });

    } catch (execError: any) {
      console.error(`[Pulse Manual] Job ${id} Failed:`, execError);

      await supabaseAdmin.from('pulse_queue').update({ 
        status: 'FAILED',
        log_message: `Manual Run Error: ${execError.message}`
      }).eq('id', id);

      await supabaseAdmin.from('pulse_logs').insert({
        queue_id: id,
        status: 'FAILURE',
        result_summary: { error: execError.message }
      });

      return NextResponse.json({ error: execError.message }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}