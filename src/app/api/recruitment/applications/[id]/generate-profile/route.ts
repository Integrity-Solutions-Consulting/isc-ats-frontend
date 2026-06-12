import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get("access-token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const backendRes = await fetch(
    `${BACKEND}/recruitment/applications/${id}/generate-profile`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return new Response(JSON.stringify(err), { status: backendRes.status });
  }

  const disposition = backendRes.headers.get("content-disposition") ?? `attachment; filename="perfil_${id}.docx"`;

  return new Response(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": disposition,
    },
  });
}
