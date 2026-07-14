import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendPut } from "@/lib/backendFetch";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json() as { role_id: number };
  try {
    const data = await backendPut(`/auth/users/${id}/role`, body);
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    if (message.includes("Backend 404")) return NextResponse.json({ error: message }, { status: 404 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
