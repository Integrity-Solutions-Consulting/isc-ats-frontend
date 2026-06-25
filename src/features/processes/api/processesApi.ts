export interface ProcessStage {
  id: string;
  name: string;
  /** Catalog code from the stage parameter — used for by-code matching in syncStages. */
  code?: string;
  type: 'normal' | 'final' | 'rejected';
}

export interface Process {
  id: string;
  name: string;
  clientCompany: string;
  department: string;
  stages: ProcessStage[];
  isActive: boolean;
}

export async function listProcesses(): Promise<Process[]> {
  try {
    const res = await fetch('/api/org/processes', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as Array<{
        id: string; name: string; clientCompany: string; department: string; isActive: boolean;
      }>;
      return data.map((p) => ({ ...p, stages: [] }));
    }
  } catch {}
  return [];
}

export async function getProcess(id: string): Promise<Process | null> {
  try {
    const res = await fetch(`/api/org/processes/${id}`, { cache: "no-store" });
    if (res.ok) return res.json() as Promise<Process | null>;
  } catch {}
  return null;
}

export async function saveProcess(process: Process): Promise<void> {
  const isNew = process.id.startsWith("local-");
  const url = isNew ? "/api/org/processes" : `/api/org/processes/${process.id}`;
  const method = isNew ? "POST" : "PATCH";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(process),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Error al guardar el proceso");
  }
}

export async function deleteProcess(id: string): Promise<void> {
  await fetch(`/api/org/processes/${id}`, { method: 'DELETE' }).catch(() => null);
}
