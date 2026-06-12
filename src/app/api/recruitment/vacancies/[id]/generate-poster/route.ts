import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8000/api/v1';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get('access-token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const upstream = await fetch(
    `${BACKEND}/recruitment/vacancies/${id}/generate-poster`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return new Response(JSON.stringify(err), { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="poster_${id}.png"`,
    },
  });
}
