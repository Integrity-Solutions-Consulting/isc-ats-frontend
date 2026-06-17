import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendTalentPoolEntry {
  id: number;
  candidate_id: number;
  source_vacancy_id: number | null;
  is_active: boolean;
  created_at: string;
}
interface BackendCandidateExpanded {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  career: string | null;
  avatar_file_id: number | null;
  is_active: boolean;
}
interface BackendVacancyListItem {
  id: number;
  vacancy_name: string;
}
interface BackendApplication {
  id: number;
  vacancy_id: number;
  candidate_id: number;
  match_score: number | null;
}

const AVATAR_COLORS = [
  "bg-primary-600",
  "bg-accent-500",
  "bg-primary-400",
  "bg-primary-700",
  "bg-accent-600",
  "bg-primary-300",
  "bg-accent-400",
  "bg-primary-500",
];

export async function GET() {
  try {
    const [entriesPage, candidatesPage, vacanciesPage, applicationsPage] = await Promise.all([
      backendGet<BackendPage<BackendTalentPoolEntry>>("/talent/talent-pool?size=100"),
      backendGet<BackendPage<BackendCandidateExpanded>>("/recruitment/candidates/expanded?size=100"),
      backendGet<BackendPage<BackendVacancyListItem>>("/recruitment/vacancies/expanded?size=100"),
      backendGet<BackendPage<BackendApplication>>("/recruitment/applications?size=100"),
    ]);

    const candidateMap = new Map(candidatesPage.items.map((c) => [c.id, c]));
    const vacancyMap = new Map(vacanciesPage.items.map((v) => [v.id, v]));

    // Map candidateId + vacancyId to match_score
    const appMatchMap = new Map<string, number>();
    for (const app of applicationsPage.items) {
      if (app.match_score != null) {
        appMatchMap.set(`${app.candidate_id}:${app.vacancy_id}`, Math.round(app.match_score));
      }
    }

    const resolvedEntries = entriesPage.items
      .map((entry) => {
        const candidate = candidateMap.get(entry.candidate_id);
        if (!candidate) return null;

        const vacancy = entry.source_vacancy_id ? vacancyMap.get(entry.source_vacancy_id) : null;
        const matchPercent = entry.source_vacancy_id
          ? (appMatchMap.get(`${entry.candidate_id}:${entry.source_vacancy_id}`) ?? 80)
          : 80;

        const firstName = candidate.first_name || "";
        const lastName = candidate.last_name || "";
        const initials = (firstName[0] + (lastName[0] ?? "")).toUpperCase();

        return {
          id: String(entry.id),
          candidateId: String(entry.candidate_id),
          candidateName: `${firstName} ${lastName}`.trim(),
          candidateInitials: initials,
          avatarColor: AVATAR_COLORS[candidate.id % AVATAR_COLORS.length],
          candidateAvatarFileId: candidate.avatar_file_id ?? undefined,
          career: candidate.career ?? "Sin carrera especificada",
          phone: candidate.phone ?? "Sin teléfono",
          email: candidate.email,
          vacancyId: entry.source_vacancy_id ? String(entry.source_vacancy_id) : "",
          vacancyTitle: vacancy ? vacancy.vacancy_name : "General",
          matchPercent,
          savedAt: entry.created_at,
          isActive: entry.is_active,
        };
      })
      .filter(Boolean);

    return NextResponse.json(resolvedEntries);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      candidate_id: number;
      source_vacancy_id?: number | null;
    };
    const created = await backendPost<BackendTalentPoolEntry>("/talent/talent-pool", {
      candidate_id: body.candidate_id,
      source_vacancy_id: body.source_vacancy_id ?? null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Surface the backend's duplicate/reference error so the UI can react.
    const isConflict = message.includes("409") || message.includes("422");
    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 500 },
    );
  }
}
