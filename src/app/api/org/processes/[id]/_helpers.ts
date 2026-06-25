import { backendGet, backendPatch, backendDelete, backendPost } from "@/lib/backendFetch";

export interface BackendProcess {
  id: number;
  name: string;
  client_company_id: number;
  department_id: number;
  is_active: boolean;
}

export interface BackendStage {
  id: number;
  process_id: number;
  stage_id: number;
  order: number;
  is_final_positive: boolean;
  is_active: boolean;
}

export interface BackendCompany { id: number; name: string; }
export interface BackendDept { id: number; name: string; }
export interface BackendParam { id: number; type: string; code: string; name: string; }
export interface BackendPage<T> { items: T[]; total: number; }

export interface MappedStage {
  id: string;
  name: string;
  code: string;
  type: "final" | "normal" | "rejected";
}

/** Backbone stage codes the backend auto-seeds — never delete them via syncStages. */
const BACKBONE_CODES = new Set(["applicants", "offer"]);

export function buildMappedStages(
  stages: BackendStage[],
  stageParamMap: Map<number, BackendParam>,
): MappedStage[] {
  const mapped: MappedStage[] = stages.map((s) => {
    const param = stageParamMap.get(s.stage_id);
    return {
      id: String(s.id),
      name: param?.name ?? `Etapa ${s.stage_id}`,
      code: param?.code ?? "",
      type: s.is_final_positive ? "final" : "normal",
    };
  });
  if (!mapped.some((s) => s.type === "rejected")) {
    mapped.push({ id: "virtual-rejected", name: "Rechazados", code: "rejected", type: "rejected" });
  }
  return mapped;
}

export async function syncStages(
  processId: string,
  incomingStages: Array<{ id: string; name: string; code?: string; type: "normal" | "final" | "rejected" }>,
  stageParams: BackendParam[],
): Promise<void> {
  // Build a code-keyed map from the catalog for fast lookup
  const paramByCode = new Map(stageParams.map((p) => [p.code, p]));

  const filtered = incomingStages
    .filter((s) => s.type !== "rejected")
    .map((s, index) => {
      // Match by code first; fall back to name for stages without a code (legacy)
      const param = s.code
        ? paramByCode.get(s.code)
        : stageParams.find((p) => p.name.toLowerCase() === s.name.toLowerCase());
      if (!param) throw new Error(`Etapa no encontrada en el catálogo: ${s.name}`);
      return { stage_id: param.id, code: param.code, order: index + 1, is_final_positive: s.type === "final" };
    });

  const existingStages = await backendGet<BackendStage[]>(`/org/process-stages?process_id=${processId}`);

  // Build a map of existing stages keyed by stage_id (catalog param id)
  // We need to know the code for each existing stage to decide whether to skip
  const existingParamMap = new Map(stageParams.map((p) => [p.id, p]));
  const existingMap = new Map(existingStages.map((s) => [s.stage_id, s]));
  const incomingStageIds = new Set(filtered.map((s) => s.stage_id));

  // Move ALL non-backbone stages to temp orders to free UNIQUE(process_id, order) slots
  for (const s of existingStages) {
    const existingCode = existingParamMap.get(s.stage_id)?.code ?? "";
    if (BACKBONE_CODES.has(existingCode)) continue; // preserve backbone
    await backendPatch(`/org/process-stages/${s.id}`, { order: s.id + 1_000_000 });
  }
  // Soft-delete removed stages (skip backbone codes)
  for (const s of existingStages) {
    const existingCode = existingParamMap.get(s.stage_id)?.code ?? "";
    if (BACKBONE_CODES.has(existingCode)) continue; // never delete backbone
    if (!incomingStageIds.has(s.stage_id)) {
      await backendDelete(`/org/process-stages/${s.id}`);
    }
  }
  // Update kept stages
  for (const inc of filtered) {
    if (BACKBONE_CODES.has(inc.code)) continue; // backbone managed by backend
    const existing = existingMap.get(inc.stage_id);
    if (existing) {
      await backendPatch(`/org/process-stages/${existing.id}`, {
        order: inc.order,
        is_final_positive: inc.is_final_positive,
      });
    }
  }
  // Insert new stages
  for (const inc of filtered) {
    if (BACKBONE_CODES.has(inc.code)) continue; // backbone managed by backend
    if (!existingMap.has(inc.stage_id)) {
      await backendPost("/org/process-stages", {
        process_id: Number(processId),
        stage_id: inc.stage_id,
        order: inc.order,
        is_final_positive: inc.is_final_positive,
      });
    }
  }
}
