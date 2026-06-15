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
  cities: RegistrationCatalogOption[];
  provinces: RegistrationCatalogOption[];
  educationLevels: RegistrationCatalogOption[];
  careers: RegistrationCatalogOption[];
  universities: RegistrationCatalogOption[];
}

// Backend parameter type → response key. One typed fetch per catalog keeps each
// request under the backend's 100-item page cap.
const TYPE_TO_KEY = {
  city: "cities",
  province: "provinces",
  education_level: "educationLevels",
  career: "careers",
  university: "universities",
} as const;

export async function GET(): Promise<NextResponse> {
  try {
    const types = Object.keys(TYPE_TO_KEY) as (keyof typeof TYPE_TO_KEY)[];
    const pages = await Promise.all(
      types.map((t) =>
        backendGet<BackendPage<BackendParam>>(`/org/parameters?type=${t}&size=100`),
      ),
    );

    const toOptions = (items: BackendParam[]): RegistrationCatalogOption[] =>
      items.map((p) => ({ id: p.id, code: p.code, name: p.name }));

    const catalogs: RegistrationCatalogs = {
      cities: [],
      provinces: [],
      educationLevels: [],
      careers: [],
      universities: [],
    };
    types.forEach((t, i) => {
      catalogs[TYPE_TO_KEY[t]] = toOptions(pages[i].items);
    });

    return NextResponse.json(catalogs satisfies RegistrationCatalogs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
