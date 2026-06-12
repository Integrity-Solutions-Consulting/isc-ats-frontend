import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file_id: string }> },
) {
  const store = await cookies();
  const token = store.get("access-token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { file_id } = await params;
  const isPreview = new URL(request.url).searchParams.get("view") === "1";

  const backendRes = await fetch(`${BACKEND}/storage/files/${file_id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { detail?: string }).detail ?? "Error al descargar el archivo" },
      { status: backendRes.status },
    );
  }

  const contentType = backendRes.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = backendRes.headers.get("content-length");

  const backendDisposition = backendRes.headers.get("content-disposition") ?? "";
  const filename = backendDisposition.match(/filename="?([^";]+)"?/)?.[1] ?? "cv.pdf";
  const disposition = isPreview
    ? `inline; filename="${filename}"`
    : `attachment; filename="${filename}"`;

  const headers: Record<string, string> = {
    "Content-Disposition": disposition,
    "Content-Type": contentType,
  };
  if (contentLength) headers["Content-Length"] = contentLength;

  return new NextResponse(backendRes.body, { status: 200, headers });
}
