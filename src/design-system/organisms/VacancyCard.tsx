import { Check, MapPin } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { CandidateVacancy } from '@/features/candidate-portal/types';

const WORK_MODE_LABEL: Record<CandidateVacancy['workMode'], string> = {
  remote: 'Remoto',
  onsite: 'Presencial',
  hybrid: 'Híbrido',
};

const MAX_VISIBLE_TAGS = 7;

interface VacancyCardProps {
  vacancy: CandidateVacancy;
  onClick: () => void;
  /** Optional footer slot — rendered below the horizontal divider. */
  footer: React.ReactNode;
  /** When true, renders the card in an "already applied" visual state. */
  applied?: boolean;
}

/**
 * Shared vacancy card used in both the candidate portal list and the public
 * job board. Tags come exclusively from `vacancy.skills` (knowledge items).
 *
 * Tag container has a fixed 2-row height so all cards align vertically
 * regardless of how many knowledge tags a vacancy has.
 */
export function VacancyCard({ vacancy, onClick, footer, applied = false }: VacancyCardProps) {
  const tags = vacancy.skills.slice(0, MAX_VISIBLE_TAGS);
  const overflow = vacancy.skills.length - MAX_VISIBLE_TAGS;

  return (
    <article
      onClick={onClick}
      className={cn(
        'relative backdrop-blur-sm rounded-xl p-5 flex flex-col gap-3 hover:shadow-brand-md transition-all cursor-pointer',
        applied
          ? 'bg-success/[0.03] border border-success/40'
          : 'bg-surface/93 border border-border',
      )}
    >
      {applied && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-success text-white text-[11px] font-semibold px-2.5 py-1 rounded-full leading-none">
          <Check size={10} strokeWidth={3} />
          Postulando
        </div>
      )}
      <h3 className={cn('text-[16px] font-bold text-ink line-clamp-2 leading-snug', applied && 'pr-28')}>
        {vacancy.title}
      </h3>

      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        <span>{WORK_MODE_LABEL[vacancy.workMode]}</span>
        <span>·</span>
        <span>{vacancy.experienceYears} año{vacancy.experienceYears !== 1 ? 's' : ''} exp.</span>
        <span>·</span>
        <MapPin size={12} className="shrink-0" />
        <span>{vacancy.city}</span>
      </div>

      {/*
        Two-row tag container: fixed height = 2 × tag height (py-1 + text-[11px] ≈ 22px) +
        gap between rows (gap-1.5 ≈ 6px) = ~50px.  overflow-hidden clips any extras.
      */}
      <div className="flex flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: '50px' }}>
        {tags.map((skill) => (
          <span
            key={skill}
            className="bg-surface-2 text-ink text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
          >
            {skill}
          </span>
        ))}
        {overflow > 0 && (
          <span className="bg-primary-100 text-primary-700 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
            +{overflow}
          </span>
        )}
      </div>

      <div className="w-full h-px bg-border" />

      {footer}
    </article>
  );
}
