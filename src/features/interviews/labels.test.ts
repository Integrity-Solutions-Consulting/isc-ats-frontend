import { describe, it, expect } from 'vitest';

import { isPastInterview, STATUS_BADGE_VARIANT, STATUS_LABEL } from './labels';

describe('isPastInterview', () => {
  it('returns true for an instant well in the past', () => {
    expect(isPastInterview('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('returns false for an instant in the future', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isPastInterview(future)).toBe(false);
  });

  it('returns true for an instant one millisecond ago', () => {
    const justNow = new Date(Date.now() - 1).toISOString();
    expect(isPastInterview(justNow)).toBe(true);
  });
});

describe('interview status labels', () => {
  it('covers every interview status code with a label', () => {
    expect(STATUS_LABEL.scheduled).toBe('Agendada');
    expect(STATUS_LABEL.offered).toBe('Ofrecida');
    expect(STATUS_LABEL.confirmed).toBe('Confirmada');
    expect(STATUS_LABEL.cancelled).toBe('Cancelada');
    expect(STATUS_LABEL.completed).toBe('Completada');
  });

  it('covers every interview status code with a badge variant', () => {
    expect(STATUS_BADGE_VARIANT.scheduled).toBe('info');
    expect(STATUS_BADGE_VARIANT.cancelled).toBe('danger');
    expect(STATUS_BADGE_VARIANT.completed).toBe('default');
  });
});
