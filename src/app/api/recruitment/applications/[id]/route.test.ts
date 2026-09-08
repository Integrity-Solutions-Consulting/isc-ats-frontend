import { describe, it, expect, vi, beforeEach } from 'vitest';

const backendGet = vi.fn();

vi.mock('@/lib/backendFetch', () => ({
  backendGet: (...args: unknown[]) => backendGet(...args),
  backendPatch: vi.fn(),
  backendErrorResponse: vi.fn(),
}));

import { GET } from './route';

const BASE_APPLICATION = {
  id: 7,
  vacancy_id: 3,
  candidate_id: 11,
  current_stage_id: 2,
  current_status_id: null,
  match_score: '82.50',
  salary_expectation: '1200.00',
  applied_at: '2026-09-01T12:00:00+00:00',
  updated_at: null,
  is_active: true,
};

function callGet() {
  return GET({} as never, { params: Promise.resolve({ id: '7' }) });
}

beforeEach(() => {
  backendGet.mockReset();
});

describe('GET /api/recruitment/applications/[id] — salary expectation', () => {
  it('carries the declared expectation through instead of reporting zero', async () => {
    // It used to be hardcoded to 0 here, so every candidate's profile would have
    // claimed an expectation of $0 no matter what they actually asked for.
    backendGet.mockResolvedValue(BASE_APPLICATION);

    const body = await (await callGet()).json();

    expect(body.salaryExpectation).toBe(1200);
  });

  it('parses the value as a number — the backend sends Decimal as a string', async () => {
    backendGet.mockResolvedValue(BASE_APPLICATION);

    const body = await (await callGet()).json();

    expect(typeof body.salaryExpectation).toBe('number');
  });

  it('reports an undeclared expectation as null, not as zero', async () => {
    // The column is nullable and predates the required-field change, so older
    // applications really do carry NULL. Folding that into 0 would state on
    // screen that the candidate asked for nothing.
    backendGet.mockResolvedValue({ ...BASE_APPLICATION, salary_expectation: null });

    const body = await (await callGet()).json();

    expect(body.salaryExpectation).toBeNull();
  });

  it('keeps a declared zero, which is a real answer', async () => {
    // "0" is truthy as a string but must not be confused with "not declared" —
    // a truthiness check here would collapse the two.
    backendGet.mockResolvedValue({ ...BASE_APPLICATION, salary_expectation: '0.00' });

    const body = await (await callGet()).json();

    expect(body.salaryExpectation).toBe(0);
  });
});
