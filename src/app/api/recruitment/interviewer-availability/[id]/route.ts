import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { backendDelete } from '@/lib/backendFetch';

/** Remove one of the user's availability windows (soft delete on the backend). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendDelete(`/recruitment/interviewer-availability/${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
