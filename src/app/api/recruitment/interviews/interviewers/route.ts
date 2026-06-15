import { NextResponse } from 'next/server';

import { backendGet } from '@/lib/backendFetch';

interface BackendInterviewer {
  id: number;
  email: string;
}

/** Staff: list users that have at least one active availability window. */
export async function GET() {
  try {
    const data = await backendGet<BackendInterviewer[]>(
      '/recruitment/interviews/interviewers',
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
