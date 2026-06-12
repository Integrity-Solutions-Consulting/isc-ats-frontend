import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost } from "@/lib/backendFetch";
import type { AIAnalysis } from "@/features/candidates/types";

interface BackendApplication {
  id: number;
  match_score: number | null;
  match_summary: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json(null);

  try {
    const app = await backendGet<BackendApplication>(`/recruitment/applications/${id}`);

    if (app.match_score === null || app.match_summary === null) {
      return NextResponse.json({
        isAnalyzing: true,
        matchPercent: null,
        summary: "",
        strengths: [],
        gaps: [],
        skills: [],
        tools: [],
        softSkills: [],
        certifications: [],
      } satisfies AIAnalysis);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(app.match_summary);
    } catch {
      return NextResponse.json({
        matchPercent: Math.round(Number(app.match_score)),
        summary: app.match_summary,
        strengths: [],
        gaps: [],
        skills: [],
        tools: [],
        softSkills: [],
        certifications: [],
      } satisfies AIAnalysis);
    }

    const analysis: AIAnalysis = {
      noTextLayer: parsed.noTextLayer === true,
      matchPercent: parsed.noTextLayer ? null : Math.round(Number(app.match_score)),
      summary: String(parsed.summary ?? ""),
      strengths: (parsed.strengths as string[]) ?? [],
      gaps: (parsed.gaps as string[]) ?? [],
      skills: (parsed.skills as AIAnalysis["skills"]) ?? [],
      tools: (parsed.tools as AIAnalysis["tools"]) ?? [],
      softSkills: (parsed.softSkills as AIAnalysis["softSkills"]) ?? [],
      certifications: (parsed.certifications as AIAnalysis["certifications"]) ?? [],
    };

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    await backendPost(`/recruitment/applications/${id}/analyze`, {});
    return NextResponse.json({ status: "queued" }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "failed to queue analysis" }, { status: 500 });
  }
}
