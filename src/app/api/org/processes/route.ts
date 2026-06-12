import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet, backendPost } from "@/lib/backendFetch";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPage<T> { items: T[]; total: number; }
interface BackendProcess {
  id: number; name: string; client_company_id: number; department_id: number; is_active: boolean;
}
interface BackendCompany { id: number; name: string; }
interface BackendDept { id: number; name: string; }
interface BackendParam { id: number; type: string; code: string; name: string; }

async function authedFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const token = store.get("access-token")?.value;
  return fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET() {
  try {
    const [procsData, companiesData, deptsData] = await Promise.all([
      backendGet<BackendPage<BackendProcess>>("/org/processes?size=100&include_inactive=true"),
      backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
      backendGet<BackendPage<BackendDept>>("/org/departments?size=100"),
    ]);
    const companyMap = new Map(companiesData.items.map((c) => [c.id, c.name]));
    const deptMap = new Map(deptsData.items.map((d) => [d.id, d.name]));
    const rows = procsData.items.map((p) => ({
      id: String(p.id),
      name: p.name,
      clientCompany: companyMap.get(p.client_company_id) ?? String(p.client_company_id),
      clientCompanyId: String(p.client_company_id),
      department: deptMap.get(p.department_id) ?? String(p.department_id),
      departmentId: String(p.department_id),
      isActive: p.is_active,
    }));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      clientCompany: string;
      department: string;
      stages: Array<{
        id: string;
        name: string;
        type: "normal" | "final" | "rejected";
      }>;
    };

    const [companiesData, deptsData, stageParams] = await Promise.all([
      backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
      backendGet<BackendPage<BackendDept>>("/org/departments?size=100"),
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=stage&size=100"),
    ]);

    const company = companiesData.items.find(
      (c) => c.name.toLowerCase() === body.clientCompany.toLowerCase()
    );
    const dept = deptsData.items.find(
      (d) => d.name.toLowerCase() === body.department.toLowerCase()
    );

    if (!company) {
      return NextResponse.json({ error: `Cliente no encontrado: ${body.clientCompany}` }, { status: 400 });
    }
    if (!dept) {
      return NextResponse.json({ error: `Departamento no encontrado: ${body.department}` }, { status: 400 });
    }

    const store = await cookies();
    const token = store.get("access-token")?.value;
    const res = await fetch(`${BACKEND}/org/processes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: body.name,
        client_company_id: company.id,
        department_id: dept.id,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
    }

    const created = await res.json() as BackendProcess;

    // Save stages for the new process (excluding virtual 'rejected' stage)
    const incomingStages = (body.stages || [])
      .filter((s) => s.type !== "rejected")
      .map((s, index) => {
        const param = stageParams.items.find(
          (p) => p.name.toLowerCase() === s.name.toLowerCase()
        );
        if (!param) {
          throw new Error(`Etapa no encontrada en el catálogo: ${s.name}`);
        }
        return {
          stage_id: param.id,
          order: index + 1,
          is_final_positive: s.type === "final",
        };
      });

    for (const incoming of incomingStages) {
      await backendPost("/org/process-stages", {
        process_id: created.id,
        stage_id: incoming.stage_id,
        order: incoming.order,
        is_final_positive: incoming.is_final_positive,
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
