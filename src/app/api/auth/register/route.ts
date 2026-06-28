import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor" },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    const detail = ((data as { detail?: string }).detail ?? '').toLowerCase();
    const errorMsg = (detail.includes('already') || detail.includes('exist') || detail.includes('duplicate') || detail.includes('registrado'))
      ? 'Ya existe una cuenta con este correo electrónico.'
      : 'No se pudo crear la cuenta. Por favor, intentá de nuevo.';
    return NextResponse.json({ error: errorMsg }, { status: backendRes.status });
  }

  return NextResponse.json({ message: "Usuario registrado exitosamente" }, { status: 201 });
}
