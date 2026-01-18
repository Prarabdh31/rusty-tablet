import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSchedule } from '@/lib/services/planner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  // NOTE: Vercel Cron requests include the header `Authorization: Bearer <CRON_SECRET>` automatically.
  // Manual requests must mimic this.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Pulse Heartbeat: Unauthorized attempt.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    console.log(`[Pulse Heartbeat] Waking up at UTC: ${now}`);
    
    // 1. Fetch Pending Jobs due for execution
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('pulse_queue')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_at', now) // Ensure we only pick jobs from the past/present
      .order('scheduled_at', { ascending: true })
      .limit(1);

    if (fetchError) throw fetchError;

    // --- AUTO-REFILL LOGIC ---
    const { count } = await supabaseAdmin
      .from('pulse_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');
    
    if (count !== null && count <= 2) {
       console.log("[Pulse] Queue running low. Auto-refilling...");
       await generateSchedule(false); 
    }
    // -------------------------

    if (!jobs || jobs.length === 0) {
      console.log("[Pulse] No jobs due at this time.");
      return NextResponse.json({ message: 'No jobs due.' });
    }

    const job = jobs[0];
    console.log(`[Pulse] Found Job ${job.id} scheduled for ${job.scheduled_at}. Executing...`);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    await supabaseAdmin.from('pulse_queue').update({ status: 'PROCESSING' }).eq('id', job.id);

    try {
      // Execute
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

      await supabaseAdmin.from('pulse_queue').update({ status: 'COMPLETED' }).eq('id', job.id);
      
      await supabaseAdmin.from('pulse_logs').insert({
        queue_id: job.id,
        status: 'SUCCESS',
        result_summary: { 
           title: result.title,
           post_id: result.post_id 
        }
      });
      
      console.log(`[Pulse] Job ${job.id} Success: ${result.title}`);
      return NextResponse.json({ success: true, job_id: job.id, result });

    } catch (execError: any) {
      console.error(`[Pulse] Job ${job.id} Failed:`, execError);

      const maxRetries = 3; 
      const nextRetry = (job.retry_count || 0) + 1;
      
      if (nextRetry < maxRetries) {
        const delay = 15 * 60 * 1000;
        const nextTime = new Date(Date.now() + delay).toISOString();
        
        await supabaseAdmin.from('pulse_queue').update({ 
          status: 'PENDING',
          retry_count: nextRetry,
          scheduled_at: nextTime,
          log_message: `Retry ${nextRetry}: ${execError.message}`
        }).eq('id', job.id);
      } else {
        await supabaseAdmin.from('pulse_queue').update({ 
          status: 'FAILED',
          log_message: `Max retries reached. Error: ${execError.message}`
        }).eq('id', job.id);
      }

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