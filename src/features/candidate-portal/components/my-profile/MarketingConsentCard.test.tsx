import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { MarketingConsentCard } from './MarketingConsentCard';

describe('MarketingConsentCard', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ decided: true, subscribed: false }),
    }) as unknown as typeof fetch;
  });

  it('reflects subscribed=true from the prop', () => {
    render(<MarketingConsentCard subscribed />);
    expect(screen.getByText(/recibiendo novedades/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desactivar/i })).toBeInTheDocument();
  });

  it('reflects subscribed=false from the prop', () => {
    render(<MarketingConsentCard subscribed={false} />);
    expect(screen.getByText(/no recibes novedades/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activar/i })).toBeInTheDocument();
  });

  it('PUTs {subscribed: false, source: "profile_toggle"} when toggling off', async () => {
    const user = userEvent.setup();
    render(<MarketingConsentCard subscribed />);

    await user.click(screen.getByRole('button', { name: /desactivar/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/candidate/consents/marketing');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({
      subscribed: false,
      source: 'profile_toggle',
    });
  });

  it('optimistically flips state immediately, before the request resolves', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<MarketingConsentCard subscribed={false} />);

    await user.click(screen.getByRole('button', { name: /activar/i }));

    expect(screen.getByText(/recibiendo novedades/i)).toBeInTheDocument();

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ decided: true, subscribed: true }) });
    });
  });

  it('rolls back to the previous state when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const user = userEvent.setup();
    render(<MarketingConsentCard subscribed={false} />);

    await user.click(screen.getByRole('button', { name: /activar/i }));

    await waitFor(() => expect(screen.getByText(/no recibes novedades/i)).toBeInTheDocument());
  });
});
