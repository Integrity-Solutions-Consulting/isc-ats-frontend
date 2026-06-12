import type { CandidateStageStatus, MatchStatus } from '@/shared/types/pipeline';

export type AITagMatch = 'match' | 'miss' | 'neutral';

export interface AIExtractedTag {
  label: string;
  match: AITagMatch;
}

export interface AIAnalysis {
  applicationId?: string;
  isAnalyzing?: boolean;       // true = still pending
  noTextLayer?: boolean;       // true = CV has no extractable text
  matchPercent: number | null;
  summary: string;
  strengths: string[];
  gaps: string[];
  skills: AIExtractedTag[];
  tools: AIExtractedTag[];
  softSkills: AIExtractedTag[];
  certifications: AIExtractedTag[];
  analyzedAt?: string;
}

export interface CandidateCV {
  fileId: string | null; // storage file id; null when the candidate has no CV
  fileName: string;
  uploadedAt: string;
  pageCount: number;
  fileSizeKB: number;
  url: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  nationalId: string;
  dateOfBirth: string; // ISO date
  email: string;
  phone: string;
  city: string;
  province: string;
  educationLevel: string;
  degree: string;
  currentlyStudying: boolean;
  currentlyEmployed: boolean;
  currentEmployer: string | null;
  cv: CandidateCV;
  isActive?: boolean;
}

export interface CandidateApplication {
  id: string; // application id = PipelineCard.id
  candidateId: string;
  vacancyId: string;
  stageId: string;
  stageStatus: CandidateStageStatus;
  currentStatusId: number | null;
  matchPercent: number | null;
  matchStatus: MatchStatus;
  salaryExpectation: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateNote {
  id: string;
  applicationId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  createdAt: string; // ISO datetime
}

export interface OtherApplication {
  applicationId: string;
  vacancyId: string;
  vacancyTitle: string;
  companyName: string;
  statusLabel: string; // display string, e.g. "Llamada de validación"
}
