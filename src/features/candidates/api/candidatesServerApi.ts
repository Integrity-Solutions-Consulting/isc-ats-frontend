/**
 * SERVER-ONLY candidate API helpers.
 *
 * These functions use backendGet (which imports next/headers) and must NEVER
 * be imported by client components or hooks. Import from candidatesApi.ts for
 * shared (client + server) functions.
 */
import { backendGet } from '@/lib/backendFetch';
import type { AIAnalysis, CandidateNote } from '../types';

interface BackendApplicationWithAnalysis {
  id: number;
  match_score: string | null;
  match_summary: string | null;
  updated_at: string | null;
  applied_at: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

interface BackendNoteItem {
  id: number;
  application_id: number;
  content: string;
  created_at: string;
  created_by: number | null;
  author_name?: string;
}

/**
 * Fetches the most-recent AI analysis for any of the candidate's applications.
 * Picks the app with a non-null match_score, sorted by most recently updated.
 * Returns null if none exist or none have been analyzed yet.
 */
export async function getBestAnalysisForCandidate(candidateId: string): Promise<AIAnalysis | null> {
  if (!/^\d+$/.test(candidateId)) return null;
  try {
    const page = await backendGet<BackendPage<BackendApplicationWithAnalysis>>(
      `/recruitment/applications?candidate_id=${candidateId}&size=100`,
    );
    const items = page.items ?? [];

    // Pick most recently updated application that has a score
    const analyzed = items
      .filter((a) => a.match_score !== null)
      .sort((a, b) => {
        const da = new Date(a.updated_at ?? a.applied_at).getTime();
        const db = new Date(b.updated_at ?? b.applied_at).getTime();
        return db - da;
      });

    if (analyzed.length === 0) return null;

    const best = analyzed[0];
    if (best.match_summary === null) {
      return {
        isAnalyzing: true,
        matchPercent: null,
        summary: '',
        strengths: [],
        gaps: [],
        skills: [],
        tools: [],
        softSkills: [],
        certifications: [],
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(best.match_summary) as Record<string, unknown>;
    } catch {
      return {
        matchPercent: Math.round(Number(best.match_score)),
        summary: best.match_summary,
        strengths: [],
        gaps: [],
        skills: [],
        tools: [],
        softSkills: [],
        certifications: [],
      };
    }

    return {
      noTextLayer: parsed.noTextLayer === true,
      matchPercent: parsed.noTextLayer ? null : Math.round(Number(best.match_score)),
      summary: String(parsed.summary ?? ''),
      strengths: (parsed.strengths as string[]) ?? [],
      gaps: (parsed.gaps as string[]) ?? [],
      skills: (parsed.skills as AIAnalysis['skills']) ?? [],
      tools: (parsed.tools as AIAnalysis['tools']) ?? [],
      softSkills: (parsed.softSkills as AIAnalysis['softSkills']) ?? [],
      certifications: (parsed.certifications as AIAnalysis['certifications']) ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Fetches all notes across all applications of a candidate,
 * merged and sorted by most recent first.
 */
export async function getAllNotesForCandidate(candidateId: string): Promise<CandidateNote[]> {
  if (!/^\d+$/.test(candidateId)) return [];
  try {
    // 1. Get all application ids for the candidate
    const appsPage = await backendGet<BackendPage<{ id: number }>>(
      `/recruitment/applications?candidate_id=${candidateId}&size=100`,
    );
    const appIds = (appsPage.items ?? []).map((a) => a.id);
    if (appIds.length === 0) return [];

    // 2. Fetch notes for each application in parallel
    const notesPerApp = await Promise.all(
      appIds.map(async (appId) => {
        try {
          const data = await backendGet<BackendPage<BackendNoteItem>>(
            `/recruitment/application-notes?application_id=${appId}&size=100`,
          );
          return (data.items ?? []).map((n): CandidateNote => {
            const authorName = n.author_name ?? 'Staff';
            const parts = authorName.split(' ').filter(Boolean);
            const initials = parts.length >= 2
              ? (parts[0][0] + parts[1][0]).toUpperCase()
              : authorName.slice(0, 2).toUpperCase();
            return {
              id: String(n.id),
              applicationId: String(n.application_id),
              authorName,
              authorInitials: initials,
              body: n.content,
              createdAt: n.created_at,
            };
          });
        } catch {
          return [];
        }
      }),
    );

    // 3. Merge and sort by most recent first
    return notesPerApp
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}
