import { describe, it, expect } from 'vitest';
import { deriveCandidateStatus } from './deriveCandidateStatus';
import type { VacancyStage } from '@/features/candidate-portal/types';

const makeStage = (overrides: Partial<VacancyStage>): VacancyStage => ({
  id: 1,
  name: 'Entrevista',
  order: 1,
  is_initial: false,
  is_final_positive: false,
  ...overrides,
});

const statusMap = new Map<number, string>([
  [1, 'active'],
  [2, 'hired'],
  [3, 'rejected'],
  [4, 'withdrawn'],
]);

describe('deriveCandidateStatus', () => {
  it('returns "rejected" when status code is "rejected"', () => {
    expect(deriveCandidateStatus(3, null, [], statusMap)).toBe('rejected');
  });

  it('returns "cancelled" when status code is "withdrawn"', () => {
    expect(deriveCandidateStatus(4, null, [], statusMap)).toBe('cancelled');
  });

  it('returns "hired" when status code is "hired"', () => {
    expect(deriveCandidateStatus(2, null, [], statusMap)).toBe('hired');
  });

  it('returns "rejected" when active but current_stage_id is null (safety)', () => {
    expect(deriveCandidateStatus(1, null, [], statusMap)).toBe('rejected');
  });

  it('returns "hired" when active and current stage is_final_positive', () => {
    const stages = [makeStage({ id: 10, is_final_positive: true })];
    expect(deriveCandidateStatus(1, 10, stages, statusMap)).toBe('hired');
  });

  it('returns "reviewing" when active and current stage is not final', () => {
    const stages = [makeStage({ id: 5, is_final_positive: false, is_initial: false })];
    expect(deriveCandidateStatus(1, 5, stages, statusMap)).toBe('reviewing');
  });

  it('returns "reviewing" when active and stage not found in stages list (unknown stage)', () => {
    const stages = [makeStage({ id: 5 })];
    expect(deriveCandidateStatus(1, 99, stages, statusMap)).toBe('reviewing');
  });

  it('returns "reviewing" when status_id not in map (defaults to active path)', () => {
    const stages = [makeStage({ id: 7, is_initial: false })];
    expect(deriveCandidateStatus(99, 7, stages, statusMap)).toBe('reviewing');
  });

  // W-2: initial stage (Postulantes) must derive to 'applied', not 'reviewing'
  it('returns "applied" when active and current stage is_initial===true', () => {
    const stages = [makeStage({ id: 3, is_initial: true, is_final_positive: false })];
    expect(deriveCandidateStatus(1, 3, stages, statusMap)).toBe('applied');
  });

  it('returns "applied" when active, status_id not in map, and current stage is_initial===true', () => {
    const stages = [makeStage({ id: 8, is_initial: true, is_final_positive: false })];
    expect(deriveCandidateStatus(99, 8, stages, statusMap)).toBe('applied');
  });

  it('returns "hired" (not "applied") when stage is both is_initial and is_final_positive', () => {
    // is_final_positive takes precedence
    const stages = [makeStage({ id: 11, is_initial: true, is_final_positive: true })];
    expect(deriveCandidateStatus(1, 11, stages, statusMap)).toBe('hired');
  });
});
