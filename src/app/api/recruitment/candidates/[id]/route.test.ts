import { describe, it, expect, vi, beforeEach } from 'vitest';

const backendGet = vi.fn();

vi.mock('@/lib/backendFetch', () => ({
  backendGet: (...args: unknown[]) => backendGet(...args),
}));

import { GET } from './route';

const BASE_CANDIDATE = {
  id: 4,
  user_id: 42,
  email: 'ana@test.example.com',
  first_name: 'Ana',
  last_name: 'Pérez',
  cedula: '0102030405',
  birth_date: null,
  phone: null,
  city: null,
  education_level: null,
  career: null,
  is_studying: false,
  is_working: false,
  current_company: null,
  years_of_experience: '3.5',
  cv_file_id: null,
  avatar_file_id: null,
  is_active: true,
  created_at: '2026-09-01T12:00:00+00:00',
};

function callGet() {
  return GET({} as never, { params: Promise.resolve({ id: '4' }) });
}

beforeEach(() => {
  backendGet.mockReset();
});

describe('GET /api/recruitment/candidates/[id] — years of experience', () => {
  it('carries the declared experience through to the staff profile', async () => {
    backendGet.mockResolvedValue(BASE_CANDIDATE);

    const body = await (await callGet()).json();

    expect(body.yearsOfExperience).toBe(3.5);
  });

  it('parses the value as a number — the backend sends Decimal as a string', async () => {
    // Left as a string, the half year would survive but any numeric formatting
    // downstream would silently do nothing.
    backendGet.mockResolvedValue(BASE_CANDIDATE);

    const body = await (await callGet()).json();

    expect(typeof body.yearsOfExperience).toBe('number');
  });

  it('reports undeclared experience as null, not as zero', async () => {
    backendGet.mockResolvedValue({ ...BASE_CANDIDATE, years_of_experience: null });

    const body = await (await callGet()).json();

    expect(body.yearsOfExperience).toBeNull();
  });

  it('keeps a declared zero, which is a real answer', async () => {
    backendGet.mockResolvedValue({ ...BASE_CANDIDATE, years_of_experience: '0.0' });

    const body = await (await callGet()).json();

    expect(body.yearsOfExperience).toBe(0);
  });
});
