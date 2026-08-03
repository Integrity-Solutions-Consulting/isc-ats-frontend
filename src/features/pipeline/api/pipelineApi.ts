import type {
  VacancyDocument,
  VacancyPipeline,
  VacancyPipelineStats,
} from '../types';
import { serverAuthHeaders } from '@/lib/serverAuthHeaders';
import { INTERNAL_BASE_URL as BASE } from '@/lib/internalBaseUrl';

export async function getVacancyPipeline(vacancyId: string): Promise<VacancyPipeline> {
  try {
    const res = await fetch(`${BASE}/api/recruitment/vacancies/${vacancyId}/pipeline`, {
      cache: 'no-store',
      headers: await serverAuthHeaders(),
    });
    if (res.ok) return res.json() as Promise<VacancyPipeline>;
  } catch {}
  return { stages: [], cards: [], rejectionSummary: { total: 0, reasons: [] } };
}

export async function movePipelineCard(
  cardId: string,
  toStageId: string,
  rejectionReason?: string,
): Promise<void> {
  // Moving to a new stage resets the sub-status: each stage starts with none.
  // A rejection is signaled by the presence of `rejectionReason` (required by
  // RejectReasonDialog before it ever calls onConfirm) rather than by relying
  // on toStageId's shape — toStageId is "rejected" (the virtual Rechazados
  // column's frontend-only sentinel id) in that case, which is NOT guaranteed
  // to stay non-numeric forever; deriving `null` from Number("rejected") being
  // NaN would silently send the wrong current_stage_id if that sentinel ever
  // changed to a real numeric stage id.
  const isReject = Boolean(rejectionReason);
  const res = await fetch(`/api/recruitment/applications/${cardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_stage_id: isReject ? null : Number(toStageId),
      current_status_id: null,
      ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(body.error ?? body.detail ?? 'No se pudo mover la postulación.');
  }
}

export async function getVacancyStats(vacancyId: string): Promise<VacancyPipelineStats> {
  try {
    const pipeline = await getVacancyPipeline(vacancyId);
    return {
      totalApplicants: pipeline.cards.length,
      newApplicants: 0,
      filledCount: pipeline.hiredCount ?? 0,
      openings: pipeline.openings ?? 0,
      rejectedCount: pipeline.rejectionSummary.total,
      highMatchCount: pipeline.cards.filter((c) => (c.matchPercent ?? 0) >= 80).length,
    };
  } catch {
    return { totalApplicants: 0, newApplicants: 0, filledCount: 0, openings: 0, rejectedCount: 0, highMatchCount: 0 };
  }
}

export async function getVacancyDocuments(vacancyId: string): Promise<VacancyDocument[]> {
  try {
    const res = await fetch(`/api/recruitment/vacancies/${vacancyId}/documents`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const items = await res.json() as Array<{
      id: number;
      application_id: number;
      candidate_id: number;
      candidate_name: string;
      candidate_initials: string;
      candidate_avatar_color: string;
      stage_name_at_generation: string;
      file_name: string;
      file_id: number | null;
      stored_key: string | null;
      version: number;
      generated_by: string;
      generated_at: string;
    }>;
    return items.map((d) => ({
      id: String(d.id),
      candidateId: String(d.candidate_id),
      candidateName: d.candidate_name,
      candidateInitials: d.candidate_initials,
      candidateAvatarColor: d.candidate_avatar_color,
      stageNameAtGeneration: d.stage_name_at_generation,
      fileName: d.file_name,
      version: d.version,
      generatedBy: d.generated_by,
      generatedAt: d.generated_at,
    }));
  } catch {
    return [];
  }
}
