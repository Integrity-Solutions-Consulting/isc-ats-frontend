import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendDelete, backendErrorResponse } from "@/lib/backendFetch";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendDelete(`/ai/vacancy-promo-images/${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
