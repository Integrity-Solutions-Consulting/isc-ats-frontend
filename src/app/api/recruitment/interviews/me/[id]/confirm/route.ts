import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendPost } from "@/lib/backendFetch";

interface ConfirmBody {
  start: string;
  end: string;
}

/**
 * The authenticated candidate confirms a chosen slot for their own open
 * interview offer (Mode B). Proxies POST /recruitment/interviews/me/{id}/confirm.
 * Ownership is enforced by the backend against the bearer token.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as ConfirmBody;
  try {
    const confirmed = await backendPost(
      `/recruitment/interviews/me/${Number(id)}/confirm`,
      { chosen_slot: { start: body.start, end: body.end } },
    );
    return NextResponse.json(confirmed, { status: 200 });
  } catch (error) {
    const message = String(error);
    // 400/404/409 → the offer expired, was already confirmed, or the slot is no
    // longer free. Surface a friendly, actionable message to the candidate.
    if (/\b(400|404|409)\b/.test(message)) {
      return NextResponse.json(
        {
          error:
            "Esta oferta ya no está disponible. Es posible que haya expirado o que el horario ya no esté libre. Vuelve a cargar la página.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "No se pudo confirmar el horario. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
