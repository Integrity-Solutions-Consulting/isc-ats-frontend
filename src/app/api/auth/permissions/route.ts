import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendPermission {
  id: number;
  code: string;
  name: string;
  module: string | null;
  is_active: boolean;
}

// Proxies the canonical backend permission catalog so the Roles screen can be
// driven by the real codes instead of a hardcoded frontend list.
export async function GET() {
  try {
    const data = await backendGet<BackendPage<BackendPermission>>(
      "/auth/permissions?size=300",
    );
    const items = data.items
      .filter((p) => p.is_active)
      .map((p) => ({ id: p.id, code: p.code, name: p.name, module: p.module }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
