import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendFetch";

interface BackendParameterTypes {
  unrestricted: boolean;
  types: string[];
}

// Proxies the caller's writable catalog-parameter-types so the Catálogos
// screen can gate write actions per role-based grant instead of the old
// hardcoded "vacancy_name only" rule.
export async function GET() {
  try {
    const data = await backendGet<BackendParameterTypes>("/auth/me/parameter-types");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
