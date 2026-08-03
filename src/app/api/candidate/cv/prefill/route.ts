import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clientIpHeader } from "@/lib/clientIp";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Forward the PDF as multipart so the backend can extract data in memory.
    // The CV is NOT persisted here — it is only stored when the candidate
    // finishes registration.
    const formData = await request.formData();

    const backendRes = await fetch(
      `${BACKEND}/recruitment/candidates/cv/prefill`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...clientIpHeader(request),
          // Do NOT set Content-Type — fetch sets it with the multipart boundary
        },
        body: formData,
      },
    );

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { detail?: string }).detail ?? "No se pudo analizar tu hoja de vida." },
        { status: backendRes.status },
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch {
    // Never echo the server-side failure text: a Node fetch error ("fetch
    // failed", "ECONNREFUSED") is English and exposes infrastructure.
    return NextResponse.json(
      { error: "No se pudo analizar tu hoja de vida. Intenta de nuevo en unos minutos." },
      { status: 500 },
    );
  }
}
