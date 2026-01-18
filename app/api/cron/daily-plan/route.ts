import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/services/planner';

export async function GET(req: NextRequest) {
  // 1. Auth Check (Vercel Cron)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("[Daily Plan] Generating schedule for the next 24 hours...");
    
    // Generate new jobs (false = append to existing, don't clear)
    const count = await generateSchedule(false);

    return NextResponse.json({ 
      success: true, 
      message: `Daily Plan Executed. Added ${count} jobs to the queue.` 
    });

  } catch (error: any) {
    console.error("Daily Plan Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}