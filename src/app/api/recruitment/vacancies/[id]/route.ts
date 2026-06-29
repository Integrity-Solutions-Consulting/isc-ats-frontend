import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet, backendPatch, backendDelete, backendErrorResponse } from "@/lib/backendFetch";
import {
  mapVacancy, buildCatalogMaps, resolveReferences,
  type BackendVacancyItem, type BackendPage, type BackendParam,
} from "./_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    interface BackendList { items: BackendVacancyItem[]; total: number; }
    const [data, catalogs] = await Promise.all([
      backendGet<BackendList>(`/recruitment/vacancies/expanded?size=100&include_inactive=true`),
      buildCatalogMaps(),
    ]);
    const item = data.items.find((v) => String(v.id) === id);
    if (!item) return NextResponse.json(null);
    return NextResponse.json(mapVacancy(item, catalogs));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json() as { values?: any; status?: string; isActive?: boolean };

    if (!body.values && body.isActive !== undefined) {
      await backendPatch(`/recruitment/vacancies/${id}`, { is_active: body.isActive });
      return new NextResponse(null, { status: 204 });
    }

    const { values, status } = body;

    let finalStatus = status;
    if (!finalStatus) {
      const current = await backendGet<{ status_id: number }>(`/recruitment/vacancies/${id}`);
      const statusesData = await backendGet<BackendPage<BackendParam>>("/org/parameters?type=vacancy_status&size=10");
      const param = statusesData.items.find((p) => p.id === current.status_id);
      finalStatus = param?.code ?? "draft";
    }

    const refs = await resolveReferences(values.position, values.workMode, values.level, finalStatus);

    const payload = {
      vacancy_name_id: refs.vacancy_name_id,
      client_company_id: Number(values.clientCompany),
      contact_id: Number(values.contact),
      department_id: Number(values.department),
      process_id: Number(values.process),
      career_id: Number(values.career),
      city_id: Number(values.city),
      work_mode_id: refs.work_mode_id,
      resource_level_id: refs.resource_level_id,
      status_id: refs.status_id,
      openings: values.openings,
      experience_years: values.experienceYears ?? 0,
      work_schedule: values.workSchedule || null,
      project_duration_years: values.durationYears ?? 0,
      project_duration_months: values.durationMonths ?? 0,
      description: values.description || null,
      profile_requirements: values.requirements || { knowledge: [], tools: [], skills: [], certifications: [] },
    };

    const updated = await backendPatch<BackendVacancyItem>(`/recruitment/vacancies/${id}`, payload);
    return NextResponse.json(mapVacancy(updated));
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendDelete(`/recruitment/vacancies/${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
