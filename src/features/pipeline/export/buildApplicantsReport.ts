import type { CandidateDirectoryEntry } from '@/features/candidates/types';
import type { SpreadsheetReport } from '@/shared/export/spreadsheet';
import type { PipelineCard } from '../types';

const MISSING = 'Sin registrar';

function ageAt(birthDate: string | null | undefined, today: Date): number | null {
  if (!birthDate) return null;
  const date = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  if (!Number.isFinite(date.getTime()) || date > today) return null;
  let age = today.getFullYear() - date.getFullYear();
  if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age--;
  return age;
}

export function buildApplicantsReport({ cards, entries, vacancy, origin, logo, now = new Date() }: {
  cards: PipelineCard[];
  entries: CandidateDirectoryEntry[];
  vacancy: { position: string; clientCompany: string };
  origin: string;
  logo: string;
  now?: Date;
}): SpreadsheetReport {
  const byCandidate = new Map(entries.map((entry) => [entry.id, entry]));
  return {
    company: 'Integrity Solutions',
    title: `Postulantes · ${vacancy.position}`,
    client: vacancy.clientCompany,
    generatedAt: now,
    logo,
    columns: [
      { title: 'Nombre completo', width: 34 },
      { title: 'Edad', width: 16, format: '0' },
      { title: 'Teléfono', width: 20 },
      { title: 'Correo', width: 34 },
      { title: 'CV', width: 20 },
      { title: 'Título', width: 30 },
      { title: 'Estudia actualmente', width: 22 },
      { title: 'Conocimientos', width: 45 },
      { title: 'Herramientas', width: 40 },
      { title: 'Ciudad', width: 22 },
      { title: 'Universidad', width: 38 },
      { title: 'Experiencia laboral (años)', width: 26, format: '0.##' },
      { title: 'Aspiración salarial', width: 22, format: '"$"#,##0.00' },
      { title: 'Fecha de postulación', width: 24, format: 'dd/mm/yyyy hh:mm' },
      { title: 'Match', width: 20, format: '0%' },
    ],
    rows: cards.map((card) => {
      const entry = byCandidate.get(card.candidateId);
      const application = entry?.vacancies.find((item) => item.applicationId === card.id);
      if (!entry || !application) {
        throw new Error('Faltan datos de algunos postulantes. Recarga la página e intenta descargar nuevamente.');
      }
      const appliedAt = application.appliedAt ? new Date(application.appliedAt) : null;
      return [
        card.candidateName,
        ageAt(entry.dateOfBirth, now) ?? MISSING,
        entry.phone || MISSING,
        entry.email || MISSING,
        entry.cvFileId ? { text: 'Ver CV', hyperlink: new URL(`/api/candidate/cv/${entry.cvFileId}?view=1`, origin).href } : 'Sin CV',
        entry.title || 'No registrado',
        card.isStudying ? 'Sí' : 'No',
        entry.skills.length ? entry.skills.join('\n') : MISSING,
        entry.tools.length ? entry.tools.join('\n') : MISSING,
        card.city || MISSING,
        card.university || MISSING,
        card.yearsOfExperience ?? MISSING,
        card.salaryExpectation ?? MISSING,
        appliedAt && Number.isFinite(appliedAt.getTime()) ? appliedAt : MISSING,
        card.matchStatus === 'analyzing' ? 'En análisis' : card.matchPercent === null ? MISSING : card.matchPercent / 100,
      ];
    }),
  };
}
