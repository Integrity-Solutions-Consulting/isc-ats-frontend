import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIpHeader } from "@/lib/clientIp";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, password, turnstile_token, accepts_terms, accepts_marketing } = body as {
    email?: string;
    password?: string;
    turnstile_token?: string | null;
    accepts_terms?: boolean;
    accepts_marketing?: boolean;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeader(request) },
      body: JSON.stringify({
        email,
        password,
        turnstile_token,
        accepts_terms,
        accepts_marketing,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor" },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    const rawDetail = (data as { detail?: string }).detail ?? '';
    const detail = rawDetail.toLowerCase();

    // Turnstile (anti-bot) rejection: surface the backend's Spanish message as-is
    // so the user retries the challenge. Independent of email existence, so this
    // reveals nothing (no enumeration).
    if (
      backendRes.status === 403 &&
      (detail.includes('robot') || detail.includes('verificación de seguridad'))
    ) {
      return NextResponse.json({ error: rawDetail }, { status: 403 });
    }

    const errorMsg = (detail.includes('already') || detail.includes('exist') || detail.includes('duplicate') || detail.includes('registrado'))
      ? 'Ya existe una cuenta con este correo electrónico.'
      : 'No se pudo crear la cuenta. Por favor, intenta de nuevo.';
    return NextResponse.json({ error: errorMsg }, { status: backendRes.status });
  }

  return NextResponse.json({ message: "Usuario registrado exitosamente" }, { status: 201 });
}
