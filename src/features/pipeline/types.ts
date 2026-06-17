// CandidateStageStatus and MatchStatus are shared domain types — they live in
// shared/types/pipeline.ts so neither feature needs to import from the other.
// Imported into scope for use below, and re-exported for existing consumers.
import type { CandidateStageStatus, MatchStatus } from '@/shared/types/pipeline';

export type { CandidateStageStatus, MatchStatus };

export type ColumnType = 'normal' | 'final' | 'rejected';

export interface PipelineStage {
  id: string;
  vacancyId: string;
  name: string;
  order: number;
  type: ColumnType;
}

export interface PipelineCard {
  id: string;            // application id
  candidateId: string;
  vacancyId: string;
  stageId: string;
  candidateName: string;
  initials: string;
  avatarColor: string;   // Tailwind bg class e.g. 'bg-primary-600'
  avatarFileId?: number;
  matchPercent: number | null;
  matchStatus: MatchStatus;
  stageStatus: CandidateStageStatus;
  salaryExpectation: number;
  updatedAt: string;     // ISO date
}

export interface RejectionSummary {
  total: number;
  reasons: { label: string; count: number }[];
}

export interface VacancyPipelineStats {
  totalApplicants: number;
  newApplicants: number;
  filledCount: number;
  openings: number;
  rejectedCount: number;
  highMatchCount: number;
}

export interface VacancyDocument {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateInitials: string;
  candidateAvatarColor: string;
  stageNameAtGeneration: string;
  fileName: string;
  version: number;
  generatedBy: string;
  generatedAt: string;  // ISO datetime
}

export interface VacancyPipeline {
  stages: PipelineStage[];
  cards: PipelineCard[];
  rejectionSummary: RejectionSummary;
  hiredCount?: number;
  openings?: number;
}
