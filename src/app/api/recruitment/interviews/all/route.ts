import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backendGet } from '@/lib/backendFetch';

interface BackendInterviewListItem {
  id: number;
  scheduled_at: string | null;
  ends_at: string | null;
  candidate_name: string;
  vacancy_name: string;
  vacancy_id: number;
  interviewer_email: string;
  teams_meeting_url: string | null;
  status: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

/**
 * Talento Humano / Admin: paginated list of ALL interviews across every
 * vacancy (recruitment.interviews.read_agenda). Query params are forwarded
 * as-is — the backend owns paging/filtering (page, size, vacancy_id,
 * status_id, date_from, date_to).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await backendGet<BackendPage<BackendInterviewListItem>>(
      `/recruitment/interviews/all?${searchParams.toString()}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
