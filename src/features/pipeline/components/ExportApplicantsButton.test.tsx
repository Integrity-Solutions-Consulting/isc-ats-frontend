import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportApplicantsButton } from './ExportApplicantsButton';
import type { CandidateDirectoryEntry } from '@/features/candidates/types';
import type { PipelineCard } from '../types';

const mocks = vi.hoisted(() => ({ build: vi.fn(), export: vi.fn(), logo: vi.fn() }));
vi.mock('../export/buildApplicantsReport', () => ({ buildApplicantsReport: mocks.build }));
vi.mock('@/shared/export/spreadsheet', () => ({ exportSpreadsheet: mocks.export }));
vi.mock('@/shared/export/brandLogo', () => ({ loadBrandLogo: mocks.logo }));

const vacancy = { position: 'Desarrollador', clientCompany: 'Cliente' };
const cards = [{ id: '1' }] as PipelineCard[];
const entries = [] as CandidateDirectoryEntry[];

describe('Export applicants button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logo.mockResolvedValue('logo');
    mocks.build.mockReturnValue({ generatedAt: new Date('2026-11-09') });
    mocks.export.mockResolvedValue(new Blob(['xlsx']));
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:report'), revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('passes all supplied filtered cards to the report and starts a named download', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    render(<ExportApplicantsButton cards={cards} entries={entries} vacancy={vacancy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(mocks.build).toHaveBeenCalledWith(expect.objectContaining({ cards, entries, vacancy, logo: 'logo' }));
    expect(click.mock.instances[0]).toHaveAttribute('download', 'postulantes-Desarrollador-2026-11-09.xlsx');
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('disables empty and unavailable exports', () => {
    const { rerender } = render(<ExportApplicantsButton cards={[]} entries={entries} vacancy={vacancy} />);
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(<ExportApplicantsButton cards={cards} entries={entries} vacancy={vacancy} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows failures and allows retrying without downloading partial data', async () => {
    mocks.export.mockRejectedValue(new Error('No se pudo generar el Excel.'));
    render(<ExportApplicantsButton cards={cards} entries={entries} vacancy={vacancy} />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo generar el Excel.');
    expect(screen.getByRole('button')).toBeEnabled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
