import type { CandidateApplication, VacancyStage } from '@/features/candidate-portal/types';

/**
 * Derives the frontend status for a candidate application from backend data.
 *
 * @param statusId        - The application's status_id from the backend
 * @param currentStageId  - The process stage the candidate is currently at, or null
 * @param stages          - Ordered stages for the vacancy's process
 * @param statusCodeById  - Map of status_id → code string (from application_status parameter catalog)
 */
export function deriveCandidateStatus(
  statusId: number,
  currentStageId: number | null,
  stages: VacancyStage[],
  statusCodeById: Map<number, string>,
): CandidateApplication['status'] {
  const code = statusCodeById.get(statusId);

  if (code === 'rejected') return 'rejected';
  if (code === 'withdrawn') return 'cancelled';
  if (code === 'hired') return 'hired';

  // code === 'active' or unknown — derive from position in the stage pipeline
  if (currentStageId === null) return 'rejected'; // safety: active but no stage
  const stage = stages.find((s) => s.id === currentStageId);
  if (stage?.is_final_positive) return 'hired';
  // Still on the initial (Postulantes) stage — candidate applied but hasn't
  // advanced yet; must appear in Todas only, not in En proceso.
  if (stage?.is_initial) return 'applied';
  return 'reviewing';
}
