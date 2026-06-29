'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { Select } from '@/design-system/atoms/Select';
import { Avatar } from '@/design-system/atoms/Avatar';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import type {
  DashboardData,
  DashboardKPI,
  CandidateByStage,
  VacancyByClient,
  UpcomingInterview,
  TopCandidate,
} from '../types';

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: DashboardKPI }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{kpi.label}</p>
      <div className="mt-2">
        <span className="text-3xl font-bold text-ink">{kpi.value}</span>
      </div>
    </div>
  );
}

// ─── Candidates by stage ─────────────────────────────────────────────────────

interface CandidatesByStageProps {
  stages: CandidateByStage[];
  byVacancy: Record<string, CandidateByStage[]>;
  options: Array<{ id: string; label: string }>;
}

function CandidatesByStage({ stages, byVacancy, options }: CandidatesByStageProps) {
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const data = selectedVacancy ? (byVacancy[selectedVacancy] ?? stages) : stages;
  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Candidatos por etapa</p>
        <Select
          aria-label="Filtrar por vacante"
          className="w-auto min-w-[180px]"
          value={selectedVacancy}
          onChange={(e) => setSelectedVacancy(e.target.value)}
        >
          <option value="">Todas las vacantes</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-3">
        {data.map((stage) => (
          <div key={stage.stageName} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs text-ink-muted">{stage.stageName}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn('h-5 rounded-full transition-all', stage.color)}
                style={{ width: `${(stage.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium text-ink">
              {stage.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vacancies by client (donut) ──────────────────────────────────────────────

function VacanciesByClient({ data }: { data: VacancyByClient[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = [
    'var(--color-primary-600)',
    'var(--color-primary-400)',
    'var(--color-accent-500)',
    'var(--color-primary-300)',
  ];
  const squareColors = ['bg-primary-600', 'bg-primary-400', 'bg-accent-500', 'bg-primary-300'];

  const circ = 2 * Math.PI * 46;
  const segments = data.reduce<{ segmentLength: number; offset: number }[]>((acc, d) => {
    const segmentLength = (d.count / total) * circ;
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].segmentLength;
    return [...acc, { segmentLength, offset }];
  }, []);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-ink">Vacantes activas por cliente</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <svg width={128} height={128} viewBox="0 0 128 128" className="shrink-0">
          {data.map((d, i) => {
            const { segmentLength, offset } = segments[i];
            return (
              <circle
                key={d.clientName}
                cx={64}
                cy={64}
                r={46}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={22}
                strokeDasharray={`${segmentLength} ${circ - segmentLength}`}
                strokeDashoffset={-offset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '64px 64px' }}
              />
            );
          })}
          <text x={64} y={60} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700" fill="currentColor" className="text-ink">{total}</text>
          <text x={64} y={76} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="currentColor" className="text-ink-muted">vacantes</text>
        </svg>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {data.map((d, i) => (
            <div key={d.clientName} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 shrink-0 rounded-sm', squareColors[i % squareColors.length])} />
              <span className="text-xs text-ink">{d.clientName}</span>
              <span className="text-xs font-semibold text-ink">· {d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming Interviews ──────────────────────────────────────────────────────

function InterviewItem({ interview }: { interview: UpcomingInterview }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
      <Avatar size="sm" initials={interview.candidateInitials} className={cn('text-white', interview.avatarColor)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{interview.candidateName}</p>
        <p className="truncate text-xs text-ink-muted">
          {interview.position} · {interview.clientCompany}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-ink-subtle">
        <Clock className="size-3" />
        {interview.time}
      </div>
    </div>
  );
}

function InterviewsCard({ label, interviews }: { label: string; interviews: UpcomingInterview[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="size-4 text-ink-muted" />
        <p className="text-sm font-semibold text-ink">Entrevistas · {label}</p>
      </div>
      {interviews.length === 0 ? (
        <p className="text-sm text-ink-subtle">Sin entrevistas para {label.toLowerCase()}.</p>
      ) : (
        <div className="space-y-2">
          {interviews.map((i) => (
            <InterviewItem key={i.id} interview={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top Candidates Table ─────────────────────────────────────────────────────

const TOP_CANDIDATES_COLUMNS: ColumnDef<TopCandidate>[] = [
  {
    key: 'candidate',
    header: 'Candidato',
    render: (c) => (
      <div className="flex items-center gap-2.5">
        <Avatar size="sm" initials={c.initials} className={cn('text-white', c.avatarColor)} />
        <span className="font-medium text-ink">{c.firstName} {c.lastName}</span>
      </div>
    ),
  },
  {
    key: 'position',
    header: 'Vacante',
    render: (c) => <span className="text-ink-muted">{c.position}</span>,
  },
  {
    key: 'clientCompany',
    header: 'Cliente',
    render: (c) => <span className="text-ink-muted">{c.clientCompany}</span>,
  },
  {
    key: 'department',
    header: 'Área',
    render: (c) => <span className="text-ink-muted">{c.department}</span>,
  },
  {
    key: 'match',
    header: 'Match',
    align: 'right',
    render: (c) => (
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        {c.matchPercent}%
      </span>
    ),
  },
  {
    key: 'daysAgo',
    header: 'Hace',
    align: 'right',
    render: (c) => <span className="text-xs text-ink-subtle">{c.daysAgo}d</span>,
  },
];

function TopCandidatesTable({ candidates }: { candidates: TopCandidate[] }) {
  const router = useRouter();
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-ink">Candidatos potenciales</p>
      </div>
      <DataTable
        columns={TOP_CANDIDATES_COLUMNS}
        data={candidates}
        rowKey={(c) => c.applicationId}
        onRowClick={(c) => {
          const index = candidates.indexOf(c);
          router.push(ROUTES.candidatoEnVacante(c.vacancyId, c.candidateId, {
            appId: c.applicationId,
            pos: index + 1,
            total: candidates.length,
          }));
        }}
        emptyState={{ title: 'Sin candidatos potenciales.' }}
        className="rounded-t-none border-0 shadow-none"
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardPage({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">Inicio</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Row 2: stages (2/3) + donut (1/3) */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CandidatesByStage
            stages={data.candidatesByStage}
            byVacancy={data.candidatesByVacancy}
            options={data.vacancyOptions}
          />
        </div>
        <div>
          <VacanciesByClient data={data.vacanciesByClient} />
        </div>
      </div>

      {/* Row 3: interviews today | tomorrow */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InterviewsCard label="Hoy" interviews={data.upcomingInterviews.filter((i) => i.day === 'today')} />
        <InterviewsCard label="Mañana" interviews={data.upcomingInterviews.filter((i) => i.day === 'tomorrow')} />
      </div>

      <TopCandidatesTable candidates={data.topCandidates} />
    </div>
  );
}
