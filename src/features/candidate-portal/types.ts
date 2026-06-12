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
  publishedDaysAgo: number;
  closingDaysLeft: number | null;
  applicationStatus: 'none' | 'applied' | 'closing_soon';
}

export interface OfferedSlot {
  day: string;
  slots: string[];
}

export interface VacancyStage {
  id: number;
  name: string;
  order: number;
  is_final_positive: boolean;
}

export interface CandidateApplication {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  appliedAt: string;
  lastUpdate: string;
  status:
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
  salaryExpectation: number;
  slotStatus: 'pending_selection' | 'confirmed' | null;
  pendingSlots?: OfferedSlot[];
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
  idNumber: string;
  birthDate: string;
  city: string;
  province: string;
  educationLevel: string;
  career: string;
  /** Resolved name of the university (from org.parameters type=university). */
  university: string;
  homeAddress: string;
  isStudying: boolean;
  isWorking: boolean;
  currentCompany?: string;
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
