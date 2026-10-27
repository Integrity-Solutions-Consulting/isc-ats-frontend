import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}

interface BackendTalentPoolRead {
  id: number;
  candidate_id: number;
  source_vacancy_id: number | null;
  source_vacancy_title?: string | null;
  is_active: boolean;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  career?: string | null;
  title?: string | null;
  university?: string | null;
  years_of_experience?: number | string | null;
  current_company?: string | null;
  cv_file_id?: number | null;
  avatar_file_id?: number | null;
  skills?: string[];
  tools?: string[];
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const backendParams = new URLSearchParams({
      size: "100",
      include_inactive: "true",
    });

    const skill = searchParams.get("skill");
    const tool = searchParams.get("tool");
    const search = searchParams.get("search");
    const vacancyId =
      searchParams.get("source_vacancy_id") || searchParams.get("vacancyId");
    const candidateId = searchParams.get("candidate_id");

    if (skill) backendParams.set("skill", skill);
    if (tool) backendParams.set("tool", tool);
    if (search) backendParams.set("search", search);
    if (vacancyId) backendParams.set("source_vacancy_id", vacancyId);
    if (candidateId) backendParams.set("candidate_id", candidateId);

    const [entriesPage, candidatesPage, vacanciesPage, applicationsPage] =
      await Promise.all([
        backendGet<BackendPage<BackendTalentPoolRead>>(
          `/talent/talent-pool?${backendParams.toString()}`,
        ),
        backendGet<BackendPage<BackendCandidateExpanded>>(
          "/recruitment/candidates/expanded?size=100",
        ),
        backendGet<BackendPage<BackendVacancyListItem>>(
          "/recruitment/vacancies/expanded?size=100",
        ),
        backendGet<BackendPage<BackendApplication>>(
          "/recruitment/applications?size=100",
        ),
      ]);

    const candidateMap = new Map(candidatesPage.items.map((c) => [c.id, c]));
    const vacancyMap = new Map(vacanciesPage.items.map((v) => [v.id, v]));

    // Map candidateId + vacancyId to match_score
    const appMatchMap = new Map<string, number>();
    for (const app of applicationsPage.items) {
      if (app.match_score != null) {
        appMatchMap.set(
          `${app.candidate_id}:${app.vacancy_id}`,
          Math.round(app.match_score),
        );
      }
    }

    const resolvedEntries = entriesPage.items
      .map((entry) => {
        const candidate = candidateMap.get(entry.candidate_id);

        const firstName = entry.first_name ?? candidate?.first_name ?? "";
        const lastName = entry.last_name ?? candidate?.last_name ?? "";

        // If neither the enriched entry nor the expanded candidate list has the candidate, skip
        if (!firstName && !lastName && !candidate) return null;

        const initials =
          ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || "C";
        const vacancy = entry.source_vacancy_id
          ? vacancyMap.get(entry.source_vacancy_id)
          : null;
        const vacancyTitle =
          entry.source_vacancy_title ||
          (vacancy ? vacancy.vacancy_name : "General");

        const matchPercent = entry.source_vacancy_id
          ? (appMatchMap.get(
              `${entry.candidate_id}:${entry.source_vacancy_id}`,
            ) ?? 80)
          : 80;

        const avatarFileId =
          entry.avatar_file_id ?? candidate?.avatar_file_id ?? undefined;

        return {
          id: String(entry.id),
          candidateId: String(entry.candidate_id),
          candidateName: `${firstName} ${lastName}`.trim(),
          candidateInitials: initials,
          avatarColor: AVATAR_COLORS[entry.candidate_id % AVATAR_COLORS.length],
          candidateAvatarFileId: avatarFileId,
          career:
            entry.career ?? candidate?.career ?? "Sin carrera especificada",
          phone: entry.phone ?? candidate?.phone ?? "Sin teléfono",
          email: entry.email ?? candidate?.email ?? "",
          vacancyId: entry.source_vacancy_id
            ? String(entry.source_vacancy_id)
            : "",
          vacancyTitle,
          matchPercent,
          savedAt: entry.created_at,
          isActive: entry.is_active,
          skills: Array.isArray(entry.skills) ? entry.skills : [],
          tools: Array.isArray(entry.tools) ? entry.tools : [],
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
    const created = await backendPost<BackendTalentPoolRead>(
      "/talent/talent-pool",
      {
        candidate_id: body.candidate_id,
        source_vacancy_id: body.source_vacancy_id ?? null,
      },
    );
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
