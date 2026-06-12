import { notFound } from 'next/navigation';

import { getCandidate, getCandidateApplication, getAIAnalysis, getOtherApplications } from '@/features/candidates/api/candidatesApi';
import { getVacancy } from '@/features/vacancies/api/vacanciesApi';
import { getVacancyPipeline } from '@/features/pipeline/api/pipelineApi';
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
  searchParams: Promise<{ from?: string; pos?: string; total?: string; appId?: string; tpId?: string }>;
}) {
  const { id: vacancyId, candidateId } = await params;
  const { from, pos: posParam, total: totalParam, appId, tpId } = await searchParams;

  const isTalentPool = from === 'banco-talento';
  const pos = posParam ? parseInt(posParam, 10) : 1;
  const total = totalParam ? parseInt(totalParam, 10) : 1;

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

  return (
    <div className="flex flex-col gap-6">
      <VacancyBreadcrumbSetter name={vacancy.position} />
      <CandidateHeader
        candidate={candidate}
        vacancyId={vacancyId}
        vacancyName={vacancy.position}
        pos={pos}
        total={total}
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
