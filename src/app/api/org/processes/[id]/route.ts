import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet, backendPatch, backendDelete, backendErrorResponse } from "@/lib/backendFetch";
import {
  buildMappedStages, syncStages,
  type BackendProcess, type BackendStage, type BackendCompany,
  type BackendDept, type BackendParam, type BackendPage,
} from "./_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const [process, stages, companiesData, deptsData, stageParams] = await Promise.all([
      backendGet<BackendProcess>(`/org/processes/${id}`),
      backendGet<BackendStage[]>(`/org/process-stages?process_id=${id}`),
      backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
      backendGet<BackendPage<BackendDept>>("/org/departments?size=100"),
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=stage&size=100"),
    ]);

    const companyMap = new Map(companiesData.items.map((c) => [c.id, c.name]));
    const deptMap = new Map(deptsData.items.map((d) => [d.id, d.name]));
    const stageParamMap = new Map(stageParams.items.map((p) => [p.id, p]));

    return NextResponse.json({
      id: String(process.id),
      name: process.name,
      clientCompany: companyMap.get(process.client_company_id) ?? String(process.client_company_id),
      clientCompanyId: String(process.client_company_id),
      department: deptMap.get(process.department_id) ?? String(process.department_id),
      departmentId: String(process.department_id),
      isActive: process.is_active,
      stages: buildMappedStages(stages, stageParamMap),
    });
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
    const body = await request.json() as {
      name: string; clientCompany: string; department: string; isActive: boolean;
      stages: Array<{ id: string; name: string; type: "normal" | "final" | "rejected" }>;
    };

    const [companiesData, deptsData, stageParams] = await Promise.all([
      backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
      backendGet<BackendPage<BackendDept>>("/org/departments?size=100"),
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=stage&size=100"),
    ]);

    const company = companiesData.items.find((c) => c.name.toLowerCase() === body.clientCompany.toLowerCase());
    const dept = deptsData.items.find((d) => d.name.toLowerCase() === body.department.toLowerCase());

    if (!company) return NextResponse.json({ error: `Cliente no encontrado: ${body.clientCompany}` }, { status: 400 });
    if (!dept) return NextResponse.json({ error: `Departamento no encontrado: ${body.department}` }, { status: 400 });

    const updatedProcess = await backendPatch<BackendProcess>(`/org/processes/${id}`, {
      name: body.name,
      client_company_id: company.id,
      department_id: dept.id,
      is_active: body.isActive,
    });

    await syncStages(id, body.stages, stageParams.items);

    const finalStages = await backendGet<BackendStage[]>(`/org/process-stages?process_id=${id}`);
    const stageParamMap = new Map(stageParams.items.map((p) => [p.id, p]));

    return NextResponse.json({
      id: String(updatedProcess.id),
      name: updatedProcess.name,
      clientCompany: company.name,
      clientCompanyId: String(company.id),
      department: dept.name,
      departmentId: String(dept.id),
      isActive: updatedProcess.is_active,
      stages: buildMappedStages(finalStages, stageParamMap),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendDelete(`/org/processes/${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
