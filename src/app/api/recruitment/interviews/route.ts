import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backendGet, backendPost } from '@/lib/backendFetch';

interface BackendParam {
  id: number;
  type: string;
  code: string;
  name: string;
}
interface BackendPage<T> {
  items: T[];
  total: number;
}
interface CreateBody {
  applicationId: number;
  processStageId: number;
  interviewerId: number;
  start: string;
  end: string;
  extraEmail?: string;
}

async function resolveParamId(type: string, code: string): Promise<number | null> {
  const page = await backendGet<BackendPage<BackendParam>>(
    `/org/parameters?type=${type}&size=100`,
  );
  return page.items.find((p) => p.code === code)?.id ?? null;
}

/**
 * Mode A — "RH selecciona": schedule an interview directly. Resolves the
 * interview_status='scheduled' and interview_scheduler='hr' parameter ids on the
 * server so the client never deals with raw parameter ids.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateBody;
  try {
    const [statusId, schedulerId] = await Promise.all([
      resolveParamId('interview_status', 'scheduled'),
      resolveParamId('interview_scheduler', 'hr'),
    ]);
    if (!statusId || !schedulerId) {
      return NextResponse.json(
        { error: 'Faltan parámetros de entrevista (corré la migración de seed)' },
        { status: 422 },
      );
    }
    const created = await backendPost('/recruitment/interviews', {
      application_id: body.applicationId,
      process_stage_id: body.processStageId,
      interviewer_id: body.interviewerId,
      scheduled_at: body.start,
      ends_at: body.end,
      status_id: statusId,
      scheduled_by_id: schedulerId,
      extra_email: body.extraEmail || null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
