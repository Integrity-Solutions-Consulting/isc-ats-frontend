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
  type: "final" | "normal" | "rejected";
}

export function buildMappedStages(
  stages: BackendStage[],
  stageParamMap: Map<number, BackendParam>,
): MappedStage[] {
  const mapped: MappedStage[] = stages.map((s) => ({
    id: String(s.id),
    name: stageParamMap.get(s.stage_id)?.name ?? `Etapa ${s.stage_id}`,
    type: s.is_final_positive ? "final" : "normal",
  }));
  if (!mapped.some((s) => s.type === "rejected")) {
    mapped.push({ id: "virtual-rejected", name: "Rechazados", type: "rejected" });
  }
  return mapped;
}

export async function syncStages(
  processId: string,
  incomingStages: Array<{ id: string; name: string; type: "normal" | "final" | "rejected" }>,
  stageParams: BackendParam[],
): Promise<void> {
  const filtered = incomingStages
    .filter((s) => s.type !== "rejected")
    .map((s, index) => {
      const param = stageParams.find((p) => p.name.toLowerCase() === s.name.toLowerCase());
      if (!param) throw new Error(`Etapa no encontrada en el catálogo: ${s.name}`);
      return { stage_id: param.id, order: index + 1, is_final_positive: s.type === "final" };
    });

  const existingStages = await backendGet<BackendStage[]>(`/org/process-stages?process_id=${processId}`);
  const existingMap = new Map(existingStages.map((s) => [s.stage_id, s]));
  const incomingStageIds = new Set(filtered.map((s) => s.stage_id));

  // Move ALL to temp orders first to free UNIQUE(process_id, order) slots
  for (const s of existingStages) {
    await backendPatch(`/org/process-stages/${s.id}`, { order: s.id + 1_000_000 });
  }
  // Soft-delete removed stages
  for (const s of existingStages) {
    if (!incomingStageIds.has(s.stage_id)) {
      await backendDelete(`/org/process-stages/${s.id}`);
    }
  }
  // Update kept stages
  for (const inc of filtered) {
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
