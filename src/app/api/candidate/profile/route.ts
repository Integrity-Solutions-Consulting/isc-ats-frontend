import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendGet, backendPatch, backendPost } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";
import { setSessionUserCookie } from "@/lib/sessionCookie";
import type { SessionUserPayload } from "@/lib/sessionCookie";
import type { CandidateProfile } from "@/features/candidate-portal/types";

interface BackendCandidateExpanded {
  id: number;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  cedula: string | null;
  birth_date: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  education_level: string | null;
  career: string | null;
  university: string | null;
  home_address: string | null;
  is_studying: boolean;
  is_working: boolean;
  current_company: string | null;
  degree_title: string | null;
  cv_file_id: number | null;
  avatar_file_id: number | null;
  is_active: boolean;
  created_at: string;
}

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json(null, { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json(null, { status: 401 });

    const data = await backendGet<{ items: BackendCandidateExpanded[] }>(
      `/recruitment/candidates/expanded?user_id=${userId}`,
    );

    const candidate = data.items[0];
    if (!candidate) return NextResponse.json(null, { status: 404 });

    let cvFileName = "";
    let cvSizeKb = 0;
    let cvUpdatedDaysAgo = 0;
    let cvFileId: number | undefined;

    if (candidate.cv_file_id) {
      cvFileId = candidate.cv_file_id;
      try {
        const fileData = await backendGet<{
          id: number;
          original_name: string;
          size_bytes: number | null;
          created_at: string;
        }>(`/storage/files/${candidate.cv_file_id}`);
        cvFileName = fileData.original_name;
        cvSizeKb = fileData.size_bytes ? Math.round(fileData.size_bytes / 1024) : 0;
        const uploadedAt = new Date(fileData.created_at);
        cvUpdatedDaysAgo = Math.floor((Date.now() - uploadedAt.getTime()) / 86_400_000);
      } catch {
        cvFileName = `cv_${candidate.id}.pdf`;
      }
    }

    const profile: CandidateProfile = {
      id: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone ?? "",
      idNumber: candidate.cedula ?? "",
      birthDate: candidate.birth_date ?? "",
      city: candidate.city ?? "",
      province: candidate.province ?? "",
      educationLevel: candidate.education_level ?? "",
      career: candidate.career ?? "",
      university: candidate.university ?? "",
      homeAddress: candidate.home_address ?? "",
      isStudying: candidate.is_studying,
      isWorking: candidate.is_working,
      currentCompany: candidate.current_company ?? undefined,
      degreeTitle: candidate.degree_title ?? undefined,
      avatarFileId: candidate.avatar_file_id ?? undefined,
      cvFileId,
      cvFileName,
      cvSizeKb,
      cvUpdatedDaysAgo,
      stats: {
        vacanciesViewed: 0,
        applicationsCount: 0,
        interviewsCount: 0,
        hiredCount: 0,
      },
    };

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json() as {
      cvFileId?: number;
      avatarFileId?: number;
      candidateId: number;
      firstName?: string;
      lastName?: string;
      phone?: string;
      homeAddress?: string | null;
      universityId?: number | null;
      cityId?: number | null;
      provinceId?: number | null;
      educationLevelId?: number | null;
      careerId?: number | null;
      isStudying?: boolean;
      isWorking?: boolean;
      currentCompany?: string | null;
      degreeTitle?: string | null;
    };

    const { candidateId } = body;

    // Build a snake_case payload with only the fields that were sent
    const payload: Record<string, unknown> = {};
    if (body.cvFileId !== undefined) payload.cv_file_id = body.cvFileId;
    if (body.avatarFileId !== undefined) payload.avatar_file_id = body.avatarFileId;
    if (body.firstName !== undefined) payload.first_name = body.firstName;
    if (body.lastName !== undefined) payload.last_name = body.lastName;
    if (body.phone !== undefined) payload.phone = body.phone;
    if (body.homeAddress !== undefined) payload.home_address = body.homeAddress;
    if (body.universityId !== undefined) payload.university_id = body.universityId;
    if (body.cityId !== undefined) payload.city_id = body.cityId;
    if (body.provinceId !== undefined) payload.province_id = body.provinceId;
    if (body.educationLevelId !== undefined) payload.education_level_id = body.educationLevelId;
    if (body.careerId !== undefined) payload.career_id = body.careerId;
    if (body.isStudying !== undefined) payload.is_studying = body.isStudying;
    if (body.isWorking !== undefined) payload.is_working = body.isWorking;
    if (body.currentCompany !== undefined) payload.current_company = body.currentCompany;
    if (body.degreeTitle !== undefined) payload.degree_title = body.degreeTitle;

    await backendPatch(`/recruitment/candidates/${candidateId}`, payload);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const {
      firstName,
      lastName,
      idNumber,
      birthDate,
      phone,
      homeAddress,
      educationLevelId,
      careerId,
      universityId,
      cityId,
      provinceId,
      isStudying,
      isWorking,
      currentCompany,
      cvFileId,
    } = body;

    // The onboarding form sends catalog parameter ids directly, so the FKs map
    // straight through — no name lookup against /org/parameters is needed.
    const payload = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      cedula: idNumber || null,
      birth_date: birthDate || null,
      phone: phone || null,
      home_address: homeAddress || null,
      city_id: cityId ?? null,
      province_id: provinceId ?? null,
      education_level_id: educationLevelId ?? null,
      career_id: careerId ?? null,
      university_id: universityId ?? null,
      is_studying: !!isStudying,
      is_working: !!isWorking,
      current_company: currentCompany || null,
      cv_file_id: cvFileId ?? null,
    };

    const created = await backendPost<Record<string, unknown>>(
      "/recruitment/candidates",
      payload,
    );

    // Re-issue session-user cookie with has_profile: true so the server is
    // the single source of truth — the client must never mutate this cookie.
    const sessionRaw = store.get("session-user")?.value;
    if (sessionRaw) {
      try {
        const current = JSON.parse(sessionRaw) as SessionUserPayload;
        const response = NextResponse.json(created, { status: 201 });
        setSessionUserCookie(response.cookies, { ...current, has_profile: true });
        return response;
      } catch {
        // Malformed cookie — still return success; client will reload via window.location
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
