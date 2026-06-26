import type { VacancyStage } from '../types';

export const STAGE_LABELS = {
  applicants: 'Postulando',
  hired: 'Contratado',
  rejected: 'No seleccionado',
} as const;

/**
 * Candidate-facing label for a process stage.
 *
 * Staff name their stages for the internal pipeline ("Postulantes",
 * "Contratación"). Candidates should see softer, status-oriented wording, but
 * only for the two fixed anchor stages (initial + final positive). Any custom
 * intermediate stage keeps its real name.
 */
export function candidateStageLabel(stage: VacancyStage): string {
  if (stage.is_initial) return STAGE_LABELS.applicants;
  if (stage.is_final_positive) return STAGE_LABELS.hired;
  return stage.name;
}
