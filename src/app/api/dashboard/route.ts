import { NextResponse } from "next/server";
import { buildDashboardData } from "@/features/dashboard/api/buildDashboardData";

export async function GET() {
  try {
    const data = await buildDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
