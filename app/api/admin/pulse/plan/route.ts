import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/services/planner';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Pass true to clear existing pending jobs (Regenerate)
    const count = await generateSchedule(true);

    return NextResponse.json({ 
      success: true, 
      message: `Schedule regenerated. ${count} jobs added.` 
    });

  } catch (error: any) {
    console.error("Planner Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}