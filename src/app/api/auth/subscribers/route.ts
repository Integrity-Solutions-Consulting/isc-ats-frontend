import { NextResponse } from "next/server";

import { backendGet, backendErrorResponse } from "@/lib/backendFetch";

interface BackendSubscriberCount {
  count: number;
}

export async function GET() {
  try {
    const data = await backendGet<BackendSubscriberCount>("/auth/subscribers");
    return NextResponse.json(data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
