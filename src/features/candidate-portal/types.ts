export interface CandidateVacancy {
  id: string;
  title: string;
  clientName: string;
  clientInitials: string;
  workMode: 'remote' | 'onsite' | 'hybrid';
  level: string;
  experienceYears: number;
  city: string;
  durationMonths: number | null;
  skills: string[];
  description: string;
  requirements: {
    knowledge: string[];
    tools: string[];
    skills: string[];
    certifications: string[];
  };
  conditions: {
    duration: string;
    city: string;
    schedule: string;
    education: string;
    level: string;
    openings: number;
  };
  /** ISO-8601 timestamp of when the vacancy was published. */
  publishedAt: string;
  closingDaysLeft: number | null;
  applicationStatus: 'none' | 'applied' | 'closing_soon';
}

/** A single offered interview slot — UTC ISO-8601 datetimes. */
export interface OfferSlot {
  start: string;
  end: string;
}

/** An open interview offer (Mode B) the candidate still has to respond to. */
export interface InterviewOffer {
  interviewId: number;
  slots: OfferSlot[];
  /** Offer expiry (UTC ISO-8601), or null when none. */
  expiresAt: string | null;
}

export interface VacancyStage {
  id: number;
  name: string;
  order: number;
  is_initial: boolean;
  is_final_positive: boolean;
}

export interface CandidateApplication {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  appliedAt: string;
  lastUpdate: string;
  status:
    | 'applied'
    | 'reviewing'
    | 'interview_initial'
    | 'interview_technical'
    | 'offer'
    | 'hired'
    | 'rejected'
    | 'cancelled';
  /** Ordered stages from the vacancy's own process. Empty when no process stages exist. */
  stages: VacancyStage[];
  /** The process_stage.id the candidate is currently at, or null. */
  currentStageId: number | null;
  /** The stage the candidate had reached when rejected (current_stage_id is nulled on rejection). */
  rejectedAtStageId: number | null;
  salaryExpectation: number;
  slotStatus: 'pending_selection' | 'confirmed' | null;
  /** Present when the candidate has an open interview offer to respond to. */
  offer?: InterviewOffer;
  interview?: {
    date: string;
    time: string;
    platform: string;
  };
}

export interface CandidateProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  docType: 'cedula' | 'passport';
  idNumber: string;
  birthDate: string;
  city: string;
  educationLevel: string;
  career: string;
  title: string;
  /** Resolved name of the university (from org.parameters type=university). */
  university: string;
  homeAddress: string;
  isStudying: boolean;
  isWorking: boolean;
  currentCompany?: string;
  avatarFileId?: number;
  cvFileId?: number;
  cvFileName: string;
  cvSizeKb: number;
  cvUpdatedDaysAgo: number;
  stats: {
    vacanciesViewed: number;
    applicationsCount: number;
    interviewsCount: number;
    hiredCount: number;
  };
}
