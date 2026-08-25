import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendPost } from "@/lib/backendFetch";
import { backendGetAllPages } from "@/lib/backendPages";

interface BackendUser {
  id: number;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  roles: string[];
}

function mapUser(u: BackendUser) {
  const prefix = u.email.split("@")[0];
  const parts = prefix.split(/[._-]/);
  const fullName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  return {
    id: String(u.id),
    fullName,
    email: u.email,
    role: u.roles.length > 0 ? u.roles.join(", ") : "Sin rol",
    status: u.is_active ? "active" : "inactive",
    lastAccessAt: u.last_login_at,
    createdAt: u.created_at,
  };
}

export async function GET() {
  try {
    const users = await backendGetAllPages<BackendUser>("/auth/users");
    return NextResponse.json(users.map(mapUser));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email: string; password: string; role_id: number; is_active?: boolean };
    const created = await backendPost<BackendUser>("/auth/users", {
      email: body.email,
      password: body.password,
      role_id: body.role_id,
      is_active: body.is_active ?? true,
    });
    return NextResponse.json(mapUser(created), { status: 201 });
  } catch (error) {
    const message = String(error);
    if (message.includes("Backend 409")) return NextResponse.json({ error: "El correo electrónico ya está en uso." }, { status: 409 });
    if (message.includes("Backend 400")) return NextResponse.json({ error: message }, { status: 400 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
