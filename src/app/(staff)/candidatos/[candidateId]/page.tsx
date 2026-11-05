import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { getAIAnalysis, getOtherApplications } from "@/features/candidates/api/candidatesApi";
import { notFound } from "next/navigation";

import { getCandidate } from "@/features/candidates/api/candidatesApi";
import {
  getAllNotesForCandidate,
} from "@/features/candidates/api/candidatesServerApi";
import { AIAnalysisReadOnlyBlock } from "@/features/candidates/components/AIAnalysisReadOnlyBlock";
import { PersonalDataCard } from "@/features/candidates/components/PersonalDataCard";
import { NotesReadOnlyCard } from "@/features/candidates/components/NotesReadOnlyCard";
import { CandidateDirectoryHeader } from "@/features/candidates/components/CandidatesDirectoryHeader";

export default async function CandidateDirectoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{
    pos?: string;
    total?: string;
    tpId?: string;
    vacancyId?: string;
    appId?: string;
  }>;
}) {
  const { candidateId } = await params;
  const {
    pos: posParam,
    total: totalParam,
    tpId,
    vacancyId,
    appId,
  } = await searchParams;

  const pos = posParam ? parseInt(posParam, 10) : 1;
  const total = totalParam ? parseInt(totalParam, 10) : 1;

  const [candidate, applications, notes] = await Promise.all([
    getCandidate(candidateId),
    getOtherApplications(candidateId),
    getAllNotesForCandidate(candidateId),
  ]);

  if (!candidate) notFound();

  const matching = applications.filter((app) => app.vacancyId === vacancyId);
  const selected = appId
    ? applications.find((app) => app.applicationId === appId)
    : vacancyId ? (matching.length === 1 ? matching[0] : undefined)
    : applications.length === 1 ? applications[0] : undefined;
  const analysis = selected ? await getAIAnalysis(selected.applicationId) : null;


  return (
    <div className="flex flex-col gap-6">
      <CandidateDirectoryHeader
        candidate={candidate}
        pos={pos}
        total={total}
        talentPoolId={tpId}
        vacancyId={selected?.vacancyId}
      />

      <div className="flex flex-col gap-6">
        {selected ? <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink">Análisis IA · {selected.vacancyTitle}</h2>
            <Link className="text-sm font-medium text-primary-700" href={ROUTES.candidatoEnVacante(selected.vacancyId, candidateId, { appId: selected.applicationId })}>Gestionar postulación</Link>
          </div>
          <AIAnalysisReadOnlyBlock analysis={analysis} />
        </> : <AIAnalysisReadOnlyBlock analysis={null} />}
        <PersonalDataCard candidate={candidate} />
        <NotesReadOnlyCard notes={notes} />
      </div>
    </div>
  );
}
