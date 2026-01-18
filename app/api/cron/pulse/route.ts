import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Secure Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // 1. Auth Check (Vercel Cron uses Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch Pending Jobs due for execution
    const now = new Date().toISOString();
    
    // We fetch strictly 1 job to ensure we don't timeout on Vercel Serverless (10s limit on Hobby)
    // The cron should run frequently (e.g. every 10 mins) to process the queue.
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('pulse_queue')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(1);

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs due.' });
    }

    const job = jobs[0];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 3. Mark as PROCESSING to prevent double-execution
    await supabaseAdmin.from('pulse_queue').update({ status: 'PROCESSING' }).eq('id', job.id);

    try {
      // 4. Execute: Call Phantom Engine
      console.log(`[Pulse] Executing Job ${job.id} (Mode: ${job.job_params.mode})...`);
      
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

      // 5. Success Handling
      await supabaseAdmin.from('pulse_queue').update({ status: 'COMPLETED' }).eq('id', job.id);
      
      // Log Success
      await supabaseAdmin.from('pulse_logs').insert({
        queue_id: job.id,
        status: 'SUCCESS',
        result_summary: { 
           title: result.title,
           post_id: result.post_id 
        }
      });

      return NextResponse.json({ success: true, job_id: job.id, result });

    } catch (execError: any) {
      console.error(`[Pulse] Job ${job.id} Failed:`, execError);

      // 6. Failure Handling (Retry Logic)
      const maxRetries = 3; 
      const nextRetry = (job.retry_count || 0) + 1;
      
      if (nextRetry < maxRetries) {
        // Reschedule for 15 mins later
        const delay = 15 * 60 * 1000;
        const nextTime = new Date(Date.now() + delay).toISOString();
        
        await supabaseAdmin.from('pulse_queue').update({ 
          status: 'PENDING',
          retry_count: nextRetry,
          scheduled_at: nextTime,
          log_message: `Retry ${nextRetry}: ${execError.message}`
        }).eq('id', job.id);
      } else {
        // Fail permanently
        await supabaseAdmin.from('pulse_queue').update({ 
          status: 'FAILED',
          log_message: `Max retries reached. Error: ${execError.message}`
        }).eq('id', job.id);
      }

      // Log Failure
      await supabaseAdmin.from('pulse_logs').insert({
        queue_id: job.id,
        status: 'FAILURE',
        result_summary: { error: execError.message }
      });

      return NextResponse.json({ error: execError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Pulse Heartbeat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}