import type { PipelineStage } from './types';

/**
 * Pure routing logic for a dnd-kit drop on the pipeline board — kept outside
 * PipelineBoard so it's unit-testable without simulating a real drag session
 * (dnd-kit's pointer sensors don't run under jsdom).
 */
export type DropAction =
  | { type: 'noop' }
  | { type: 'move'; toStageId: string }
  | { type: 'reject'; toStageId: string };

/**
 * Decides what a card drop from `fromStageId` to `toStageId` should do:
 * - dropped on its own column, or on an unknown stage → 'noop'
 * - dropped on the virtual Rechazados column → 'reject' (caller must prompt
 *   for a rejection_reason before moving the card)
 * - dropped on any other stage → 'move' (moves immediately, unchanged behavior)
 */
export function resolveDropAction(
  stages: PipelineStage[],
  fromStageId: string,
  toStageId: string,
): DropAction {
  if (fromStageId === toStageId) return { type: 'noop' };
  const toStage = stages.find((s) => s.id === toStageId);
  if (!toStage) return { type: 'noop' };
  return toStage.type === 'rejected'
    ? { type: 'reject', toStageId }
    : { type: 'move', toStageId };
}
