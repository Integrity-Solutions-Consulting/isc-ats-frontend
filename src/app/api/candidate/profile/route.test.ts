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

vi.mock('@/lib/backendFetch', () => ({
  backendGet: (...args: unknown[]) => backendGet(...args),
  backendPatch: vi.fn(),
  backendPost: vi.fn(),
  BackendError: class BackendError extends Error {},
}));

vi.mock('@/lib/sessionCookie', () => ({
  setSessionUserCookie: vi.fn(),
}));

import { GET } from './route';

const BASE_CANDIDATE = {
  id: 1,
  user_id: 42,
  email: 'candidato@test.example.com',
  first_name: 'Ana',
  last_name: 'Pérez',
  doc_type: 'cedula',
  cedula: '0102030405',
  birth_date: null,
  phone: null,
  city: null,
  education_level: null,
  career: null,
  title: null,
  university: null,
  home_address: null,
  is_studying: false,
  is_working: false,
  current_company: null,
  cv_file_id: null,
  avatar_file_id: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('GET /api/candidate/profile — marketing consent merge (D5)', () => {
  beforeEach(() => {
    backendGet.mockReset();
  });

  it('merges decided/subscribed from the second backend call into the DTO', async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/recruitment/candidates/expanded')) {
        return { items: [BASE_CANDIDATE] };
      }
      if (path === '/auth/me/consents/marketing') {
        return { decided: true, subscribed: true };
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const res = await GET();
    const body = await res.json();

    expect(body.marketingConsentDecided).toBe(true);
    expect(body.marketingConsentSubscribed).toBe(true);
  });

  it('defaults to not-decided when the consent call fails, without failing the whole request', async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/recruitment/candidates/expanded')) {
        return { items: [BASE_CANDIDATE] };
      }
      if (path === '/auth/me/consents/marketing') {
        throw new Error('backend unavailable');
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.marketingConsentDecided).toBe(false);
    expect(body.marketingConsentSubscribed).toBe(false);
    expect(body.firstName).toBe('Ana');
  });
});
