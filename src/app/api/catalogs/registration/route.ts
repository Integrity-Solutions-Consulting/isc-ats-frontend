import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendFetch";

interface BackendParam {
  id: number;
  type: string;
  code: string;
  name: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

export interface RegistrationCatalogOption {
  id: number;
  code: string;
  name: string;
}

export interface RegistrationCatalogs {
  universities: RegistrationCatalogOption[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const data = await backendGet<BackendPage<BackendParam>>(
      "/org/parameters?type=university&size=100",
    );

    const universities: RegistrationCatalogOption[] = data.items.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
    }));

    return NextResponse.json({ universities } satisfies RegistrationCatalogs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
