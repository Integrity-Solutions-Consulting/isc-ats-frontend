import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendDelete } from "@/lib/backendFetch";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entryId = Number(id);

  try {
    await backendDelete(`/talent/talent-pool/${entryId}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
