import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'access-token' ? { value: 'fake-token' } : undefined,
  }),
}));

vi.mock('@/lib/decodeUserId', () => ({
  decodeUserId: () => 42,
}));

const backendGet = vi.fn();
const backendPost = vi.fn();

vi.mock('@/lib/backendFetch', () => ({
  backendGet: (...args: unknown[]) => backendGet(...args),
  backendPost: (...args: unknown[]) => backendPost(...args),
  backendErrorResponse: (error: unknown) =>
    new Response(JSON.stringify({ error: String(error) }), { status: 500 }),
}));

import { POST } from './route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/candidate/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

describe('POST /api/candidate/applications — years_of_experience gate', () => {
  beforeEach(() => {
    backendGet.mockReset();
    backendPost.mockReset();
  });

  it('returns 422 with a Spanish message when the candidate has no years_of_experience', async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/recruitment/candidates/expanded')) {
        return { items: [{ id: 1, user_id: 42, years_of_experience: null }] };
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const res = await POST(makeRequest({ vacancyId: 10, salaryExpectation: 800 }));
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toBe('Debes completar tus años de experiencia en tu perfil antes de postular.');
    expect(backendPost).not.toHaveBeenCalled();
  });

  it('proceeds to create the application when years_of_experience is set', async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/recruitment/candidates/expanded')) {
        return { items: [{ id: 1, user_id: 42, years_of_experience: 2.5 }] };
      }
      if (path.startsWith('/org/parameters')) {
        return { items: [{ id: 5, code: 'active' }] };
      }
      throw new Error(`Unexpected path: ${path}`);
    });
    backendPost.mockResolvedValue({ id: 99 });

    const res = await POST(makeRequest({ vacancyId: 10, salaryExpectation: 800 }));

    expect(res.status).toBe(201);
    expect(backendPost).toHaveBeenCalledWith('/recruitment/applications', expect.objectContaining({
      vacancy_id: 10,
      candidate_id: 1,
      status_id: 5,
      salary_expectation: 800,
    }));
  });
});
