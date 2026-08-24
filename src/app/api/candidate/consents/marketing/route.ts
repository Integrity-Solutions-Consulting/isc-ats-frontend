import { NextResponse } from "next/server";
import { backendGet, backendPut, backendErrorResponse } from "@/lib/backendFetch";

interface MarketingConsentResponse {
  decided: boolean;
  subscribed: boolean;
}

export async function GET() {
  try {
    const data = await backendGet<MarketingConsentResponse>("/auth/me/consents/marketing");
    return NextResponse.json(data);
  } catch (error: unknown) {
    return backendErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      subscribed: boolean;
      source: "profile_modal" | "profile_toggle";
    };
    const data = await backendPut<MarketingConsentResponse>("/auth/me/consents/marketing", {
      subscribed: body.subscribed,
      source: body.source,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return backendErrorResponse(error);
  }
}
