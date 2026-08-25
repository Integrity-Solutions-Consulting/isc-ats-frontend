import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { MarketingConsentModal } from './MarketingConsentModal';

describe('MarketingConsentModal', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ decided: true, subscribed: true }),
    }) as unknown as typeof fetch;
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <MarketingConsentModal open={false} onDecided={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the two decision buttons when open is true', () => {
    render(<MarketingConsentModal open onDecided={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sí, quiero recibirlas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, gracias/i })).toBeInTheDocument();
  });

  it('has no close/X affordance', () => {
    render(<MarketingConsentModal open onDecided={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /cerrar/i })).not.toBeInTheDocument();
  });

  it('does not close on backdrop click (no dismiss handler wired to the overlay)', () => {
    const onDecided = vi.fn();
    const { container } = render(<MarketingConsentModal open onDecided={onDecided} />);
    const overlay = container.firstElementChild as HTMLElement;
    // The overlay must not carry a click-to-dismiss handler at all.
    expect(overlay.onclick).toBeNull();
    fireEvent.click(overlay);
    expect(onDecided).not.toHaveBeenCalled();
  });

  it('does not close on Escape (no keydown dismiss handler wired anywhere)', () => {
    const onDecided = vi.fn();
    const { container } = render(<MarketingConsentModal open onDecided={onDecided} />);
    fireEvent.keyDown(container, { key: 'Escape', code: 'Escape' });
    expect(onDecided).not.toHaveBeenCalled();
  });

  it('both buttons share the exact same className (equal visual weight)', () => {
    render(<MarketingConsentModal open onDecided={vi.fn()} />);
    const yes = screen.getByRole('button', { name: /sí, quiero recibirlas/i });
    const no = screen.getByRole('button', { name: /no, gracias/i });
    expect(yes.className).toBe(no.className);
  });

  it('PUTs {subscribed: true, source: "profile_modal"} and calls onDecided(true) on "Sí"', async () => {
    const onDecided = vi.fn();
    const user = userEvent.setup();
    render(<MarketingConsentModal open onDecided={onDecided} />);

    await user.click(screen.getByRole('button', { name: /sí, quiero recibirlas/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/candidate/consents/marketing');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({
      subscribed: true,
      source: 'profile_modal',
    });
    expect(onDecided).toHaveBeenCalledWith(true);
  });

  it('PUTs {subscribed: false, source: "profile_modal"} and calls onDecided(false) on "No, gracias"', async () => {
    const onDecided = vi.fn();
    const user = userEvent.setup();
    render(<MarketingConsentModal open onDecided={onDecided} />);

    await user.click(screen.getByRole('button', { name: /no, gracias/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({
      subscribed: false,
      source: 'profile_modal',
    });
    expect(onDecided).toHaveBeenCalledWith(false);
  });
});
