import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export interface RegistrationCatalogOption {
  id: number;
  code: string;
  name: string;
}

export interface RegistrationCatalogs {
  cities: RegistrationCatalogOption[];
  educationLevels: RegistrationCatalogOption[];
  careers: RegistrationCatalogOption[];
  titles: RegistrationCatalogOption[];
  universities: RegistrationCatalogOption[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const res = await fetch(
      `${BACKEND}/recruitment/candidates/registration-catalog`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { detail?: string }).detail ?? "Error al cargar catálogos" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data satisfies RegistrationCatalogs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
