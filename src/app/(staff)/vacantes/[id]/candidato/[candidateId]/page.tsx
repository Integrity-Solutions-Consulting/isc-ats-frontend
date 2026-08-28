import { notFound } from 'next/navigation';

import { getCandidate, getCandidateApplication, getAIAnalysis, getOtherApplications } from '@/features/candidates/api/candidatesApi';
import { getVacancy } from '@/features/vacancies/api/vacanciesApi';
import { getVacancyPipeline } from '@/features/pipeline/api/pipelineApi';
import { filtersToParams, parseFilters } from '@/features/pipeline/filters';
import { resolveStageNavigation } from '@/features/pipeline/navigation';
import { ROUTES } from '@/shared/constants/routes';
import { VacancyBreadcrumbSetter } from '@/features/vacancies/components/VacancyBreadcrumbSetter';
import { AIAnalysisSectionClient } from '@/features/candidates/components/AIAnalysisSectionClient';
import { CandidateHeader } from '@/features/candidates/components/CandidateHeader';
import { NotesCard } from '@/features/candidates/components/NotesCard';
import { PersonalDataCard } from '@/features/candidates/components/PersonalDataCard';
import { StatusSidebar } from '@/features/candidates/components/StatusSidebar';

export default async function CandidateProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; candidateId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id: vacancyId, candidateId } = await params;
  const query = await searchParams;
  const { from, pos: posParam, total: totalParam, appId, tpId, stageId } = query;

  const isTalentPool = from === 'banco-talento';
  // Talent-pool position still comes from the URL; the pipeline navigator is
  // derived below from the reviewed stage instead, so it survives moving the
  // candidate out of it.
  const talentPos = posParam ? parseInt(posParam, 10) : 1;
  const talentTotal = totalParam ? parseInt(totalParam, 10) : 1;

  const applicationId = appId ?? `app-${candidateId.replace('cand-', '')}`;

  const [candidate, application, vacancy, pipeline] = await Promise.all([
    getCandidate(candidateId),
    getCandidateApplication(applicationId),
    getVacancy(vacancyId),
    getVacancyPipeline(vacancyId),
  ]);

  if (!candidate || !application) notFound();
  if (!vacancy) notFound();

  const [aiAnalysis, otherApplications] = await Promise.all([
    getAIAnalysis(applicationId),
    isTalentPool ? Promise.resolve([]) : getOtherApplications(candidateId, application.id),
  ]);

  // The queue being reviewed: the stage the profile was opened from, narrowed
  // by the board's filters. `stageId` is absent on links made before it started
  // travelling in the URL — those fall back to the candidate's current stage.
  const filters = parseFilters(query);
  const filterParams = filtersToParams(filters);
  const reviewStageId = stageId ?? application.stageId;
  const nav = isTalentPool
    ? null
    : resolveStageNavigation(pipeline.cards, filters, reviewStageId, candidateId);

  // Where the recruiter continues once this candidate leaves the queue — the
  // next one still waiting in the reviewed stage, or the board when it is done.
  const boardUrl = ROUTES.vacante(vacancyId, { tab: 'pipeline', filters: filterParams });
  const nextInQueueUrl = nav?.next
    ? ROUTES.candidatoEnVacante(nav.next.vacancyId, nav.next.candidateId, {
        appId: nav.next.appId,
        stageId: reviewStageId,
        filters: filterParams,
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <VacancyBreadcrumbSetter name={vacancy.position} />
      <CandidateHeader
        candidate={candidate}
        vacancyId={vacancyId}
        vacancyName={vacancy.position}
        pos={nav?.pos ?? talentPos}
        total={nav?.total ?? talentTotal}
        navEntries={nav?.entries}
        reviewStageId={reviewStageId}
        filterParams={filterParams}
        talentPoolId={tpId}
      />

      <div className="flex gap-6 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          {!isTalentPool && (
            <AIAnalysisSectionClient
              applicationId={application.id}
              initialAnalysis={aiAnalysis}
            />
          )}
          <PersonalDataCard candidate={candidate} />
          <NotesCard applicationId={application.id} readOnly={isTalentPool} />
        </div>

        {/* Right sidebar — pipeline only */}
        {!isTalentPool && (
          <div className="w-[300px] shrink-0">
            <StatusSidebar
              application={application}
              stages={pipeline.stages}
              otherApplications={otherApplications}
              vacancyId={vacancyId}
              nextInQueueUrl={nextInQueueUrl}
              boardUrl={boardUrl}
              candidateName={candidate.fullName}
              candidateInitials={candidate.initials}
              candidateAvatarColor={candidate.avatarColor}
              position={vacancy.position}
            />
          </div>
        )}
      </div>
    </div>
  );
}
