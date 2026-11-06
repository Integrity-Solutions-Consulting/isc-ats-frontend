import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

vi.mock('./onboarding/Step0CvUpload', () => ({
  Step0CvUpload: ({ onComplete }: { onComplete: (data: object, file: File) => void }) =>
    <button onClick={() => onComplete({}, new File(['pdf'], 'cv.pdf', { type: 'application/pdf' }))}>Adjuntar CV</button>,
}));
vi.mock('./onboarding/Step1PersonalData', () => ({
  Step1PersonalData: ({ onNext }: { onNext: (data: object) => void }) =>
    <button onClick={() => onNext({ firstName: 'Ana', lastName: 'Test' })}>Datos personales</button>,
}));
vi.mock('./onboarding/Step2Education', () => ({
  Step2Education: ({ onNext, submitError }: { onNext: (data: object) => void; submitError?: string }) =>
    <div><button onClick={() => onNext({})}>Finalizar</button>{submitError && <p role="alert">{submitError}</p>}</div>,
}));

afterEach(() => vi.unstubAllGlobals());

function finishForm() {
  render(<OnboardingPage />);
  fireEvent.click(screen.getByText('Adjuntar CV'));
  fireEvent.click(screen.getByRole('button', { name: 'Datos personales' }));
  fireEvent.click(screen.getByText('Finalizar'));
}

it('reports a failed upload instead of silently leaving registration', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 7 }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Almacenamiento no disponible' }) });
  vi.stubGlobal('fetch', fetcher);
  finishForm();
  expect(await screen.findByRole('alert')).toHaveTextContent('Almacenamiento no disponible');
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('reports a failed link and reuses the uploaded file on retry', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 7 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 8 }) })
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 7 }) })
    .mockResolvedValueOnce({ ok: false });
  vi.stubGlobal('fetch', fetcher);
  finishForm();
  expect(await screen.findByRole('alert')).toHaveTextContent('no pudo vincularse');
  fireEvent.click(screen.getByText('Finalizar'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(5));
  expect(fetcher.mock.calls.filter(([url]) => url === '/api/candidate/upload')).toHaveLength(1);
});
