import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIpHeader } from "@/lib/clientIp";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { token, password } = body as { token?: string; password?: string };

  if (!token || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeader(request) },
      body: JSON.stringify({ token, new_password: password }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor" },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "El enlace es inválido o ha expirado" },
      { status: backendRes.status },
    );
  }

  return NextResponse.json({ message: "ok" }, { status: 200 });
}
