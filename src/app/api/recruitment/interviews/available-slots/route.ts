import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backendGet } from '@/lib/backendFetch';

interface BackendSlot {
  start: string;
  end: string;
}

/** Staff: free interview slots for an interviewer on a given date (YYYY-MM-DD). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interviewerId = searchParams.get('interviewer_id');
  const targetDate = searchParams.get('target_date');
  if (!interviewerId || !targetDate) {
    return NextResponse.json(
      { error: 'interviewer_id y target_date son requeridos' },
      { status: 400 },
    );
  }
  try {
    const data = await backendGet<BackendSlot[]>(
      `/recruitment/interviews/available-slots?interviewer_id=${interviewerId}&target_date=${targetDate}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
