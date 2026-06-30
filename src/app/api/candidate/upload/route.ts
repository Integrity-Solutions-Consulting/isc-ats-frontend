import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clientIpHeader } from "@/lib/clientIp";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Forward the multipart form data directly to FastAPI
    const formData = await request.formData();

    const backendRes = await fetch(`${BACKEND}/storage/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...clientIpHeader(request),
        // Do NOT set Content-Type — fetch sets it automatically with the boundary
      },
      body: formData,
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { detail?: string }).detail ?? "Error al subir el archivo" },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error inesperado al subir el archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
