import { notFound } from "next/navigation";

import { getCandidate } from "@/features/candidates/api/candidatesApi";
import {
  getBestAnalysisForCandidate,
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
  }>;
}) {
  const { candidateId } = await params;
  const {
    pos: posParam,
    total: totalParam,
    tpId,
    vacancyId,
  } = await searchParams;

  const pos = posParam ? parseInt(posParam, 10) : 1;
  const total = totalParam ? parseInt(totalParam, 10) : 1;

  const [candidate, analysis, notes] = await Promise.all([
    getCandidate(candidateId),
    getBestAnalysisForCandidate(candidateId),
    getAllNotesForCandidate(candidateId),
  ]);

  if (!candidate) notFound();

  return (
    <div className="flex flex-col gap-6">
      <CandidateDirectoryHeader
        candidate={candidate}
        pos={pos}
        total={total}
        talentPoolId={tpId}
        vacancyId={vacancyId}
      />

      <div className="flex flex-col gap-6">
        <AIAnalysisReadOnlyBlock analysis={analysis} />
        <PersonalDataCard candidate={candidate} />
        <NotesReadOnlyCard notes={notes} />
      </div>
    </div>
  );
}
