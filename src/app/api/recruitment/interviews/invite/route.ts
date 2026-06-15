import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backendPost } from '@/lib/backendFetch';

interface OfferBody {
  applicationId: number;
  processStageId: number;
  interviewerId: number;
  offeredSlots: { start: string; end: string }[];
  extraEmail?: string;
  subject?: string;
}

/**
 * Mode B — "Candidato elige": create an offered interview and notify the
 * candidate (in-app notification + email). The backend resolves the
 * 'offered'/'hr' parameters and creates the dual-channel notification.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as OfferBody;
  try {
    const created = await backendPost('/recruitment/interviews/invite', {
      application_id: body.applicationId,
      process_stage_id: body.processStageId,
      interviewer_id: body.interviewerId,
      offered_slots: body.offeredSlots,
      extra_email: body.extraEmail || null,
      subject: body.subject || null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
