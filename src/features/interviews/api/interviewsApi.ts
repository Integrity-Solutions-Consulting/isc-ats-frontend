import type {
  CreateInterviewPayload,
  InterviewListItem,
  InterviewListPage,
  InterviewListParams,
  Interviewer,
  OfferSlotsPayload,
  Slot,
} from '../types';

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

/** Wire shape of GET /recruitment/interviews/all (snake_case, as sent by FastAPI). */
interface BackendInterviewListItem {
  id: number;
  scheduled_at: string | null;
  ends_at: string | null;
  candidate_name: string;
  vacancy_name: string;
  vacancy_id: number;
  interviewer_email: string;
  teams_meeting_url: string | null;
  status: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

function toInterviewListItem(raw: BackendInterviewListItem): InterviewListItem {
  return {
    id: raw.id,
    scheduledAt: raw.scheduled_at,
    endsAt: raw.ends_at,
    candidateName: raw.candidate_name,
    vacancyName: raw.vacancy_name,
    vacancyId: raw.vacancy_id,
    interviewerEmail: raw.interviewer_email,
    teamsMeetingUrl: raw.teams_meeting_url,
    status: raw.status as InterviewListItem['status'],
  };
}

/** Talento Humano / Admin: paginated list of ALL interviews across vacancies. */
export async function listAllInterviews(
  params: InterviewListParams,
): Promise<InterviewListPage> {
  const search = new URLSearchParams();
  // `params.page` is 0-indexed (this codebase's UI convention, see Pagination
  // molecule), but the backend's `page` query param is 1-indexed (`ge=1`).
  if (params.page != null) search.set('page', String(params.page + 1));
  if (params.size != null) search.set('size', String(params.size));
  if (params.vacancyId != null) search.set('vacancy_id', String(params.vacancyId));
  if (params.statusId != null) search.set('status_id', String(params.statusId));
  if (params.dateFrom) search.set('date_from', params.dateFrom);
  if (params.dateTo) search.set('date_to', params.dateTo);

  const res = await fetch(`/api/recruitment/interviews/all?${search.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'No se pudieron cargar las entrevistas'));
  const data = (await res.json()) as BackendPage<BackendInterviewListItem>;
  return { items: data.items.map(toInterviewListItem), total: data.total };
}

export async function listInterviewers(): Promise<Interviewer[]> {
  const res = await fetch('/api/recruitment/interviews/interviewers', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getAvailableSlots(
  interviewerId: number,
  targetDate: string,
): Promise<Slot[]> {
  const res = await fetch(
    `/api/recruitment/interviews/available-slots?interviewer_id=${interviewerId}&target_date=${targetDate}`,
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createInterview(payload: CreateInterviewPayload): Promise<void> {
  const res = await fetch('/api/recruitment/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo agendar la entrevista'));
}

export async function offerSlots(payload: OfferSlotsPayload): Promise<void> {
  const res = await fetch('/api/recruitment/interviews/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo enviar la invitación'));
}
