import { describe, expect, it } from 'vitest';
import type { CandidateDirectoryEntry } from '@/features/candidates/types';
import { EMPTY_FILTERS, filterCards } from '../filters';
import type { PipelineCard } from '../types';
import { buildApplicantsReport } from './buildApplicantsReport';

const now = new Date('2026-11-09T12:00:00');
const card: PipelineCard = {
  id: '10', candidateId: '1', vacancyId: '2', stageId: '3', candidateName: 'Ana Pérez',
  initials: 'AP', avatarColor: '', matchPercent: 0, matchStatus: 'done', stageStatus: 'pending_review',
  city: 'Quito', university: 'ESPOL', isStudying: false, salaryExpectation: 0,
  yearsOfExperience: 0, updatedAt: '2026-11-09T12:00:00Z',
};
const entry: CandidateDirectoryEntry = {
  id: '1', candidateName: 'Ana Pérez', candidateInitials: 'AP', avatarColor: '',
  dateOfBirth: '2000-11-10', title: 'Ingeniera', career: '', phone: '0991234567', email: 'ana@example.com',
  cvFileId: 25, isActive: true, vacancies: [
    { vacancyId: '99', applicationId: '9', vacancyTitle: 'Otro', matchPercent: 90, appliedAt: '2025-01-01T10:00:00Z' },
    { vacancyId: '2', applicationId: '10', vacancyTitle: 'Developer', matchPercent: 0, appliedAt: '2026-11-01T10:00:00Z' },
  ], inTalentPool: false, skills: ['JavaScript', 'SQL'], tools: ['Git'], createdAt: '',
};
function report(cards = [card], entries = [entry]) {
  return buildApplicantsReport({ cards, entries, vacancy: { position: 'Developer', clientCompany: 'Cliente' }, origin: 'https://empleos.example.com', logo: '', now });
}

describe('Applicants report', () => {
  it('exports the exact application, typed values, age before birthday, and a protected CV link', () => {
    const result = report();
    expect(result.columns).toHaveLength(15);
    expect(result.rows[0]).toEqual([
      'Ana Pérez', 25, '0991234567', 'ana@example.com',
      { text: 'Ver CV', hyperlink: 'https://empleos.example.com/api/candidate/cv/25?view=1' },
      'Ingeniera', 'No', 'JavaScript\nSQL', 'Git', 'Quito', 'ESPOL', 0, 0,
      new Date('2026-11-01T10:00:00Z'), 0,
    ]);
    expect(report([{ ...card, matchPercent: 85 }]).rows[0][14]).toBe(0.85);
  });

  it('exports all filtered rows before UI pagination and preserves their order', () => {
    const cards = Array.from({ length: 14 }, (_, index) => ({ ...card, id: String(index), city: index === 13 ? 'Cuenca' : 'Quito' }));
    const entries = [{ ...entry, vacancies: cards.map((item) => ({ ...entry.vacancies[1], applicationId: item.id })) }];
    const visible = filterCards(cards, { ...EMPTY_FILTERS, city: 'Quito' });
    const result = report(visible, entries);
    expect(result.rows).toHaveLength(13);
    expect(result.rows.map((row) => row[0])).toEqual(visible.map((item) => item.candidateName));
  });

  it('distinguishes missing data and pending analysis from zero', () => {
    const result = report([{ ...card, salaryExpectation: null, yearsOfExperience: null, matchStatus: 'analyzing' }],
      [{ ...entry, dateOfBirth: null, title: null, cvFileId: null, skills: [], tools: [], vacancies: [{ ...entry.vacancies[1], appliedAt: undefined }] }]);
    expect(result.rows[0][1]).toBe('Sin registrar');
    expect(result.rows[0][4]).toBe('Sin CV');
    expect(result.rows[0].slice(11)).toEqual(['Sin registrar', 'Sin registrar', 'Sin registrar', 'En análisis']);
  });

  it('fails instead of silently downloading incomplete candidate/application data', () => {
    expect(() => report([card], [])).toThrow('Faltan datos');
    expect(() => report([card], [{ ...entry, vacancies: [entry.vacancies[0]] }])).toThrow('Faltan datos');
  });
});
