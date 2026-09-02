import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { LoginForm } from './LoginForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const EMAIL = 'candidato@test.example.com';
const PASSWORD = 'StrongPass123!';

/** Queue one fake Response per fetch call, in order. */
function mockFetchSequence(...responses: Array<{ ok: boolean; body: unknown }>) {
  const fn = vi.fn();
  for (const { ok, body } of responses) {
    fn.mockResolvedValueOnce({ ok, json: async () => body });
  }
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

async function submitLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/correo electrónico/i), EMAIL);
  await user.type(screen.getByLabelText(/^contraseña$/i), PASSWORD);
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
  return user;
}

describe('LoginForm — unverified account recovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers to resend the verification email when login fails as unverified', async () => {
    // The candidate registered, never clicked the link, and the 24h token expired.
    // Without this action the error is a dead end: the only link that could fix it
    // lives in an email they can no longer use.
    const fetchMock = mockFetchSequence(
      { ok: false, body: { error: 'Tu correo no está verificado.', code: 'email_not_verified' } },
      { ok: true, body: { message: 'ok' } },
    );
    render(<LoginForm />);

    const user = await submitLogin();

    const resend = await screen.findByRole('button', {
      name: /reenviar correo de verificación/i,
    });
    await user.click(resend);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/auth/resend');
    expect(JSON.parse(options.body as string)).toEqual({ email: EMAIL });
    expect(await screen.findByText(/te enviamos un enlace nuevo/i)).toBeInTheDocument();
  });

  it('does not offer the resend action for a plain credentials failure', async () => {
    mockFetchSequence({ ok: false, body: { error: 'Credenciales incorrectas' } });
    render(<LoginForm />);

    await submitLogin();

    expect(await screen.findByText(/credenciales incorrectas/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reenviar correo de verificación/i }),
    ).not.toBeInTheDocument();
  });
});
