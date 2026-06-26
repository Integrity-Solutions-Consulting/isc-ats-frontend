import { cookies } from "next/headers";
import { backendGet } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";

interface BackendPage<T> { items: T[]; total: number; }
interface BackendApplicationRef { vacancy_id: number; is_active: boolean; }
interface BackendCandidateRef { id: number; user_id: number; }

/**
 * Vacancy ids the logged-in candidate has already applied to (active
 * applications only). Best-effort: any failure (no token, no candidate row)
 * yields an empty set so vacancies just render as not-applied.
 */
export async function getAppliedVacancyIds(): Promise<Set<number>> {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return new Set();
    const userId = decodeUserId(token);
    if (!userId) return new Set();
    const candidates = await backendGet<{ items: BackendCandidateRef[] }>(
      `/recruitment/candidates/expanded?user_id=${userId}`,
    );
    const candidate = candidates.items[0];
    if (!candidate) return new Set();
    const appsData = await backendGet<BackendPage<BackendApplicationRef>>(
      `/recruitment/applications?candidate_id=${candidate.id}&size=100`,
    );
    return new Set(
      appsData.items.filter((a) => a.is_active).map((a) => a.vacancy_id),
    );
  } catch {
    return new Set();
  }
}
