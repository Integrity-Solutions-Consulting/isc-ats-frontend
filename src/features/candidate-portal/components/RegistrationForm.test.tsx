import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { RegistrationForm } from './RegistrationForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const STRONG_PASSWORD = 'StrongPass123!';

function fillRequiredFields() {
  return {
    email: screen.getByLabelText(/correo electrónico/i),
    password: screen.getByLabelText(/^contraseña$/i),
    confirm: screen.getByLabelText(/confirmar contraseña/i),
    terms: screen.getByLabelText(/acepto los/i),
    marketing: screen.getByLabelText(/quiero recibir información/i),
    submit: screen.getByRole('button', { name: /crear cuenta/i }),
  };
}

describe('RegistrationForm — marketing consent capture', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok' }),
    }) as unknown as typeof fetch;
  });

  it('renders the marketing checkbox unchecked by default (no pre-check)', () => {
    render(<RegistrationForm />);
    const { marketing } = fillRequiredFields();
    expect(marketing).not.toBeChecked();
  });

  it('sends accepts_terms=true and accepts_marketing=false when marketing is left unchecked', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);
    const { email, password, confirm, terms, submit } = fillRequiredFields();

    await user.type(email, 'candidato@test.example.com');
    await user.type(password, STRONG_PASSWORD);
    await user.type(confirm, STRONG_PASSWORD);
    await user.click(terms);
    await user.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.accepts_terms).toBe(true);
    expect(body.accepts_marketing).toBe(false);
  });

  it('sends accepts_marketing=true when the marketing checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);
    const { email, password, confirm, terms, marketing, submit } = fillRequiredFields();

    await user.type(email, 'candidato2@test.example.com');
    await user.type(password, STRONG_PASSWORD);
    await user.type(confirm, STRONG_PASSWORD);
    await user.click(terms);
    await user.click(marketing);
    await user.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.accepts_terms).toBe(true);
    expect(body.accepts_marketing).toBe(true);
  });
});
