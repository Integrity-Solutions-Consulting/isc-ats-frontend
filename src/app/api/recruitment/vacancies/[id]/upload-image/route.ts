import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8000/api/v1';

/**
 * POST /api/recruitment/vacancies/[id]/upload-image
 *
 * Forwards a multipart/form-data request (field: "file") to the backend
 * storage upload endpoint, tagging the file as entity_type=vacancy_image
 * and entity_id=<vacancy_id>. Returns the FileRead JSON from the backend.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get('access-token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const formData = await req.formData();
  // Re-package so we control entity_type and entity_id
  const fwdForm = new FormData();
  const fileField = formData.get('file');
  if (!fileField || !(fileField instanceof Blob)) {
    return new Response(JSON.stringify({ detail: 'Missing file field' }), { status: 422 });
  }
  fwdForm.append('file', fileField, (fileField as File).name ?? 'image');
  fwdForm.append('entity_type', 'vacancy_image');
  fwdForm.append('entity_id', id);

  const upstream = await fetch(`${BACKEND}/storage/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fwdForm,
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
