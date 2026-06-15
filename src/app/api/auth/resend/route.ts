import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email } = body as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
      { error: (data as { detail?: string }).detail ?? "Error al reenviar el correo" },
      { status: backendRes.status },
    );
  }

  return NextResponse.json({ message: "ok" }, { status: 200 });
}
