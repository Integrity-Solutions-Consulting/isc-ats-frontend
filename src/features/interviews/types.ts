// Interview scheduling — shared types for the staff (producer) side.
// All datetimes are ISO-8601 UTC strings; the UI renders them in Ecuador time.

export interface Slot {
  start: string;
  end: string;
}

export interface Interviewer {
  id: number;
  email: string;
}

/** Mode A — "RH selecciona": schedule a slot directly. */
export interface CreateInterviewPayload {
  applicationId: number;
  processStageId: number;
  interviewerId: number;
  start: string;
  end: string;
}

/** Mode B — "Candidato elige": offer a set of slots for the candidate to choose. */
export interface OfferSlotsPayload {
  applicationId: number;
  processStageId: number;
  interviewerId: number;
  offeredSlots: Slot[];
}

/** A recurring weekly availability window the interviewer offers. */
export interface AvailabilityWindow {
  id: number;
  dayOfWeek: number; // 0 = Monday ... 6 = Sunday
  startTime: string; // "HH:MM" (backend may return "HH:MM:SS")
  endTime: string;
  slotDurationMin: number;
  bufferMin: number;
}

export interface AvailabilityCreatePayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  bufferMin: number;
}

/** Interview lifecycle code, as returned by GET /recruitment/interviews/all. */
export type InterviewStatus =
  | 'scheduled'
  | 'offered'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

/** A single row of the global "Entrevistas" list — all interviews, all vacancies. */
export interface InterviewListItem {
  id: number;
  /** Null for an open Mode B offer the candidate hasn't picked a slot for yet. */
  scheduledAt: string | null;
  endsAt: string | null;
  candidateName: string;
  vacancyName: string;
  vacancyId: number;
  interviewerEmail: string;
  teamsMeetingUrl: string | null;
  status: InterviewStatus;
}

/** Optional server-side filters for the global interviews list. */
export interface InterviewListParams {
  page?: number;
  size?: number;
  vacancyId?: number;
  statusId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface InterviewListPage {
  items: InterviewListItem[];
  total: number;
}
