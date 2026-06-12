export interface DashboardKPI {
  label: string;
  value: number;
  trend: number;
  trendUp: boolean;
}

export interface CandidateByStage {
  stageName: string;
  count: number;
  color: string;
}

export interface VacancyByClient {
  clientName: string;
  count: number;
}

export interface UpcomingInterview {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarColor: string;
  position: string;
  clientCompany: string;
  time: string;
  day: 'today' | 'tomorrow';
}

export interface TopCandidate {
  candidateId: string;
  applicationId: string;
  vacancyId: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  matchPercent: number;
  position: string;
  clientCompany: string;
  department: string;
  daysAgo: number;
}

export interface DashboardData {
  kpis: DashboardKPI[];
  vacancyOptions: Array<{ id: string; label: string }>;
  candidatesByStage: CandidateByStage[];
  candidatesByVacancy: Record<string, CandidateByStage[]>;
  vacanciesByClient: VacancyByClient[];
  upcomingInterviews: UpcomingInterview[];
  topCandidates: TopCandidate[];
}
