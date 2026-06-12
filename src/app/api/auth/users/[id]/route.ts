import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendPatch } from "@/lib/backendFetch";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json() as { is_active: boolean };
  try {
    const data = await backendPatch(`/auth/users/${id}`, body);
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    // Propagate backend status codes (400, 404) so the client can distinguish them.
    if (message.includes("Backend 404")) return NextResponse.json({ error: message }, { status: 404 });
    if (message.includes("Backend 400")) return NextResponse.json({ error: message }, { status: 400 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
