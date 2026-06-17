import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { fileId } = (await request.json()) as { fileId: number };

    const backendRes = await fetch(
      `${BACKEND}/recruitment/candidates/cv/prefill?file_id=${fileId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { detail?: string }).detail ?? "Error al analizar el CV" },
        { status: backendRes.status },
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error inesperado al analizar el CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
