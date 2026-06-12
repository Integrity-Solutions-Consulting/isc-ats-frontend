import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet } from "@/lib/backendFetch";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPage<T> { items: T[]; total: number; }
interface BackendContact {
  id: number; first_name: string; last_name: string;
  email: string; client_company_id: number; is_active: boolean;
}
interface BackendCompany { id: number; name: string; }

export interface ContactRow {
  id: string; firstName: string; lastName: string;
  email: string; clientCompany: string; clientCompanyId: string; is_active: boolean;
}

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
    const [contactsData, companiesData] = await Promise.all([
      backendGet<BackendPage<BackendContact>>("/org/contacts?size=100"),
      backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
    ]);
    const companyMap = new Map(companiesData.items.map((c) => [c.id, c.name]));
    const rows: ContactRow[] = contactsData.items.map((c) => ({
      id: String(c.id),
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      clientCompany: companyMap.get(c.client_company_id) ?? String(c.client_company_id),
      clientCompanyId: String(c.client_company_id),
      is_active: c.is_active,
    }));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    firstName: string; lastName: string; email: string; clientCompanyId: string;
  };
  const res = await authedFetch("/org/contacts", {
    method: "POST",
    body: JSON.stringify({
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      client_company_id: Number(body.clientCompanyId),
    }),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json(), { status: 201 });
}
