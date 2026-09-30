import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8000/api/v1';

export async function POST(request: Request) {
  const token = (await cookies()).get('access-token')?.value;
  if (!token) return Response.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const upstream = await fetch(`${BACKEND}/ai/direct-cv-converter`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: await request.formData(),
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({ error: 'No se pudo convertir la hoja de vida.' }, { status: 500 });
  }
}
