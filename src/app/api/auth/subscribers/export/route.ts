import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function GET() {
  const store = await cookies();
  const token = store.get("access-token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND}/auth/subscribers/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return new Response(JSON.stringify(err), { status: backendRes.status });
  }

  const disposition =
    backendRes.headers.get("content-disposition") ?? 'attachment; filename="suscriptores.xlsx"';

  return new Response(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
