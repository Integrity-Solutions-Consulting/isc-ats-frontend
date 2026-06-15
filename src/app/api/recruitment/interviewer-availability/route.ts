import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

import { backendGet, backendPost } from '@/lib/backendFetch';
import { decodeUserId } from '@/lib/decodeUserId';

interface BackendAvailability {
  id: number;
  user_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  buffer_min: number;
}
interface BackendPage<T> {
  items: T[];
  total: number;
}
interface CreateBody {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  bufferMin: number;
}

function toWindow(a: BackendAvailability) {
  return {
    id: a.id,
    dayOfWeek: a.day_of_week,
    startTime: a.start_time,
    endTime: a.end_time,
    slotDurationMin: a.slot_duration_min,
    bufferMin: a.buffer_min,
  };
}

async function currentUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get('access-token')?.value;
  return token ? decodeUserId(token) : null;
}

/** The authenticated user's own availability windows. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json([], { status: 401 });
  try {
    const data = await backendGet<BackendPage<BackendAvailability>>(
      `/recruitment/interviewer-availability?user_id=${userId}&size=100`,
    );
    return NextResponse.json(data.items.map(toWindow));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

/** Add a window for the authenticated user (user_id is forced server-side). */
export async function POST(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = (await request.json()) as CreateBody;
  try {
    const created = await backendPost<BackendAvailability>(
      '/recruitment/interviewer-availability',
      {
        user_id: userId,
        day_of_week: body.dayOfWeek,
        start_time: body.startTime,
        end_time: body.endTime,
        slot_duration_min: body.slotDurationMin,
        buffer_min: body.bufferMin,
      },
    );
    return NextResponse.json(toWindow(created), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
