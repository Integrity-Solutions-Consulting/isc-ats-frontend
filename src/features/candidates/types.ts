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
  avatarFileId?: number;
  /** Drives the identity-document label: the number is a passport for foreign applicants. */
  docType: 'cedula' | 'passport';
  nationalId: string;
  dateOfBirth: string; // ISO date
  email: string;
  phone: string;
  city: string;
  homeAddress: string;
  educationLevel: string;
  /** Field of study, e.g. "Ingeniería en Sistemas". */
  career: string;
  /** Awarded title, e.g. "Ingeniero" — a different field from the career. */
  title: string;
  university: string;
  currentlyStudying: boolean;
  currentlyEmployed: boolean;
  currentEmployer: string | null;
  /** null = never declared their experience (distinct from a declared 0). */
  yearsOfExperience: number | null;
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
  /**
   * What the candidate asked for on THIS application — the same person can ask
   * for a different amount on another vacancy. null = never declared, which is
   * distinct from a declared 0.
   */
  salaryExpectation: number | null;
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
