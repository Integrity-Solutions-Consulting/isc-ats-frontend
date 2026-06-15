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
  extraEmail?: string;
}

/** Mode B — "Candidato elige": offer a set of slots for the candidate to choose. */
export interface OfferSlotsPayload {
  applicationId: number;
  processStageId: number;
  interviewerId: number;
  offeredSlots: Slot[];
  extraEmail?: string;
  subject?: string;
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
