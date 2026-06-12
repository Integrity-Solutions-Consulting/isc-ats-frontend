import { NextResponse } from "next/server";

import { backendPatch } from "@/lib/backendFetch";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendPatch(`/comms/notifications/${Number(id)}/read`, {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
