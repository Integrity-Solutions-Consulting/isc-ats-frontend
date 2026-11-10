'use client';

import { DropdownMenu } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { CandidatesTable } from '@/features/candidates/components/CandidatesTable';
import { useCandidateDirectory } from '@/features/candidates/hooks/useCandidates';
import type { CandidateDirectoryRow } from '@/features/candidates/directoryRows';
import { Pagination } from '@/design-system/molecules/Pagination';
import { ROUTES } from '@/shared/constants/routes';
import { sortCardsByMatch } from '../navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/design-system/ui/button';
import { PERM } from '@/features/auth/permissions';
import { usePermissions } from '@/features/auth/PermissionsProvider';
import { resolveDropAction } from '../dropAction';
import {
  FILTER_PARAM_KEYS,
  cityOptionsFrom,
  filterCards,
  filtersToParams,
  parseFilters,
  universityOptionsFrom,
  technologyOptionsFrom,
  withCandidateTechnologies,
  type PipelineFilters,
} from '../filters';
import { useMovePipelineCard, usePendingPipelineCards, usePipeline } from '../hooks/usePipeline';
import type { PipelineCard } from '../types';
import { PipelineFilterBar } from './PipelineFilterBar';
import { RejectReasonDialog } from './RejectReasonDialog';
import { ExportApplicantsButton } from './ExportApplicantsButton';

interface PipelineBoardProps {
  vacancyId: string;
  vacancy: { position: string; clientCompany: string };
}

interface PendingReject {
  cardId: string;
  toStageId: string;
  fromStageId: string;
  candidateName: string;
}

export function PipelineBoard({ vacancyId, vacancy }: PipelineBoardProps) {
  const router = useRouter();
  const { data: entries = [], isLoading: isDirectoryLoading, error: directoryError, refetch: refetchDirectory } = useCandidateDirectory({ vacancyId });
  const [page, setPage] = useState(0);
  const [moveError, setMoveError] = useState<string | null>(null);
  const { data: pipeline, isLoading, isError, refetch } = usePipeline(vacancyId);
  const { mutateAsync: moveCard } = useMovePipelineCard();
  const pendingCardIds = usePendingPipelineCards();
  const { has } = usePermissions();
  const searchParams = useSearchParams();
  const canMove = has(PERM.applicationsUpdate);
  // Seeded from the URL so returning from a candidate's profile — or reloading,
  // or opening a shared link — lands on the same filtered board.
  const [filters, setFilters] = useState<PipelineFilters>(() =>
    parseFilters(Object.fromEntries(searchParams.entries())),
  );
  const [pendingReject, setPendingReject] = useState<PendingReject | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const isRejecting = pendingReject !== null && pendingCardIds.includes(pendingReject.cardId);

  // Keep the same vacancy filters for the table and profile navigation.
  const allCards = useMemo(() => withCandidateTechnologies(pipeline?.cards ?? [], entries), [pipeline, entries]);
  const technologyOptions = useMemo(() => technologyOptionsFrom(allCards), [allCards]);
  const visibleCards = useMemo(() => sortCardsByMatch(filterCards(allCards, filters)), [allCards, filters]);
  const cityOptions = useMemo(() => cityOptionsFrom(allCards), [allCards]);
  const universityOptions = useMemo(() => universityOptionsFrom(allCards), [allCards]);
  const filterParams = useMemo(() => filtersToParams(filters), [filters]);

  const handleFiltersChange = useCallback((next: PipelineFilters) => {
    setFilters(next);
    setPage(0);
    // Mirrored into the URL with the native history API rather than
    // `router.replace`: every keystroke in a numeric field would otherwise
    // re-run the vacancy server page for data the board already holds.
    const params = new URLSearchParams(window.location.search);
    for (const key of FILTER_PARAM_KEYS) params.delete(key);
    for (const [key, value] of Object.entries(filtersToParams(next))) params.set(key, value);
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, []);

  if (isLoading) return <CandidatesTable data={[]} isLoading />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-danger">Error cargando el pipeline</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pipeline) return null;

  const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  function handleStageChange(fromCard: PipelineCard, toStageId: string) {
    if (!canMove || pendingCardIds.includes(fromCard.id) || pendingReject) return;
    setMoveError(null);
    const action = resolveDropAction(pipeline!.stages, fromCard.stageId, toStageId);
    if (action.type === 'noop') return;

    if (action.type === 'reject') {
      // Keep the current stage until the rejection reason is confirmed.
      setRejectError(null);
      setPendingReject({
        cardId: fromCard.id,
        toStageId: action.toStageId,
        fromStageId: fromCard.stageId,
        candidateName: fromCard.candidateName,
      });
      return;
    }

    void moveCard({
      cardId: fromCard.id,
      toStageId: action.toStageId,
      fromStageId: fromCard.stageId,
    }).catch((error: Error) => setMoveError(`${fromCard.candidateName}: ${error.message || 'No se pudo cambiar el estado.'}`));
  }

  function handleCancelReject() {
    setPendingReject(null);
    setRejectError(null);
  }

  function handleConfirmReject(reason: string) {
    if (!pendingReject || !canMove || isRejecting) return;
    setRejectError(null);
    void moveCard({
      cardId: pendingReject.cardId,
      toStageId: pendingReject.toStageId,
      fromStageId: pendingReject.fromStageId,
      rejectionReason: reason,
    }).then(() => setPendingReject(null)).catch((err: unknown) =>
      setRejectError(err instanceof Error ? err.message : 'No se pudo rechazar al candidato.'),
    );
  }

  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
  const cardsById = new Map(visibleCards.map((card) => [card.id, card]));
  const rows: CandidateDirectoryRow[] = visibleCards.map((card) => {
    const entry = entriesById.get(card.candidateId);
    const vacancy = entry?.vacancies.find((item) => item.vacancyId === vacancyId);
    return {
      id: card.candidateId,
      candidateName: card.candidateName,
      candidateInitials: card.initials,
      avatarColor: card.avatarColor,
      candidateAvatarFileId: card.avatarFileId,
      career: '', phone: '', email: '', isActive: true,
      inTalentPool: false, skills: [], tools: [], createdAt: '',
      ...entry,
      rowId: card.id,
      applicationId: card.id,
      vacancies: [{
        vacancyId,
        vacancyTitle: vacancy?.vacancyTitle ?? '-',
        applicationId: card.id,
        matchPercent: card.matchStatus === 'analyzing' ? null : card.matchPercent,
      }],
    };
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pageCount - 1);

  return (
    <div className="flex flex-col gap-4">
      <PipelineFilterBar
        stages={sortedStages}
        filters={filters}
        onChange={handleFiltersChange}
        cityOptions={cityOptions}
        universityOptions={universityOptions}
        shownCount={visibleCards.length}
        totalCount={allCards.length}
        technologyOptions={technologyOptions}
        technologiesDisabled={isDirectoryLoading || Boolean(directoryError)}
        actions={
          <ExportApplicantsButton
            cards={visibleCards}
            entries={entries}
            vacancy={vacancy}
            disabled={isDirectoryLoading || Boolean(directoryError)}
          />
        }
      />

      {directoryError && (
        <div role="alert" className="flex items-center gap-3 text-sm text-danger">
          No se pudieron cargar los datos adicionales de los candidatos.
          <Button variant="outline" size="sm" onClick={() => void refetchDirectory()}>Reintentar</Button>
        </div>
      )}
      {moveError && <p role="alert" className="text-sm text-danger">{moveError}</p>}
      <CandidatesTable
        isLoading={isDirectoryLoading}
        data={rows.slice(currentPage * 10, (currentPage + 1) * 10)}
        additionalColumns={[
          {
            key: 'salary',
            header: 'Salario',
            render: (entry) => {
              const salary = cardsById.get(entry.rowId)?.salaryExpectation;
              return <span className="whitespace-nowrap text-ink-muted">{salary == null ? 'Sin registrar' : `$ ${salary.toLocaleString('es-EC')}`}</span>;
            },
          },
          {
            key: 'experience',
            header: 'Experiencia',
            render: (entry) => {
              const years = cardsById.get(entry.rowId)?.yearsOfExperience;
              return <span className="whitespace-nowrap text-ink-muted">{years == null ? 'Sin registrar' : `${years.toLocaleString('es-EC')} ${years === 1 ? 'año' : 'años'}`}</span>;
            },
          },
        ]}
        onRowClick={(entry) => {
          const card = cardsById.get(entry.rowId);
          if (!card) return;
          router.push(ROUTES.candidatoEnVacante(vacancyId, card.candidateId, {
            appId: card.id, stageId: card.stageId, filters: filterParams,
          }));
        }}
        renderStatus={(entry) => {
          const card = cardsById.get(entry.rowId)!;
          const stage = sortedStages.find((item) => item.id === card.stageId);
          if (!canMove) return <span>{stage?.name ?? 'Sin etapa'}</span>;
          return (
            <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={pendingCardIds.includes(card.id)}
                    aria-busy={pendingCardIds.includes(card.id)}
                    aria-label={`Cambiar estado de ${card.candidateName}: ${stage?.name ?? 'Sin etapa'}`}
                    className="gap-2 whitespace-nowrap"
                  >
                    {pendingCardIds.includes(card.id) ? <span role="status">Guardando...</span> : stage?.name ?? 'Sin etapa'}
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="start" sideOffset={4} className="z-50 min-w-48 rounded-md border border-border bg-surface p-1 shadow-lg">
                    <DropdownMenu.RadioGroup value={card.stageId} onValueChange={(value) => handleStageChange(card, value)}>
                      {sortedStages.map((option) => (
                        <DropdownMenu.RadioItem
                          key={option.id}
                          value={option.id}
                          disabled={option.id === card.stageId}
                          className="cursor-pointer rounded px-3 py-2 text-sm text-ink outline-none focus:bg-primary-50 data-[state=checked]:font-semibold data-[disabled]:opacity-50"
                        >
                          {option.name}
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          );
        }}
        emptyState={{ title: 'Sin resultados para los filtros seleccionados.' }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
        <span>Mostrando {rows.length ? currentPage * 10 + 1 : 0} a {Math.min((currentPage + 1) * 10, rows.length)} de {rows.length} registros</span>
        <Pagination page={currentPage} pageCount={pageCount} onPrev={() => setPage(currentPage - 1)} onNext={() => setPage(currentPage + 1)} />
      </div>

      <RejectReasonDialog
        open={pendingReject !== null}
        candidateName={pendingReject?.candidateName}
        isSubmitting={isRejecting}
        submitError={rejectError}
        onCancel={handleCancelReject}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
