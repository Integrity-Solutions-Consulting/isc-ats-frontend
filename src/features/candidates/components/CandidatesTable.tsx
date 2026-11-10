"use client";
import type { ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { DataTable, type ColumnDef, type DataTableProps } from "@/design-system/organisms/DataTable";
import { Avatar } from "@/design-system/atoms/Avatar";
import { Badge } from "@/design-system/ui/badge";
import { Button } from "@/design-system/ui/button";
import { cn } from "@/shared/utils";
import { CandidateCvActions } from "./CandidateCvActions";
import type { CandidateDirectoryRow } from "../directoryRows";
import type { CandidateDirectoryEntry } from "../types";
const normalizeTechnology = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");

const getTechnologies = (entry: {
  skills?: string[];
  tools?: string[];
}): string[] => {
  const unique = new Map<string, string>();
  for (const value of [...(entry.skills ?? []), ...(entry.tools ?? [])]) {
    const label = value.trim().replace(/\s+/g, " ");
    if (label && !unique.has(normalizeTechnology(label))) {
      unique.set(normalizeTechnology(label), label);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, "es"));
};

const MATCH_COLORS = (pct: number) => {
  if (pct >= 75) return "text-success bg-success/10";
  if (pct >= 50) return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
};

interface CandidatesTableProps extends Omit<DataTableProps<CandidateDirectoryRow>, "columns" | "rowKey"> {
  technology?: string | null;
  addingCandidateId?: string | null;
  isAddingToTalentPool?: boolean;
  onAddToTalentPool?: (entry: CandidateDirectoryEntry) => void;
  renderStatus?: (entry: CandidateDirectoryRow) => ReactNode;
  additionalColumns?: ColumnDef<CandidateDirectoryRow>[];
}
export function CandidatesTable({
  technology, addingCandidateId, isAddingToTalentPool, onAddToTalentPool,
  renderStatus, additionalColumns = [], ...tableProps
}: CandidatesTableProps) {
  const columns: ColumnDef<CandidateDirectoryRow>[] = [
    {
      key: "candidate",
      header: "Candidato",
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            size="sm"
            initials={e.candidateInitials}
            src={
              e.candidateAvatarFileId
                ? `/api/candidate/cv/${e.candidateAvatarFileId}?view=1`
                : undefined
            }
            className={cn("text-white", e.avatarColor)}
          />
          <span className="font-medium text-ink">{e.candidateName}</span>
        </div>
      ),
    },
    {
      key: "vacancies",
      header: "Vacantes postuladas",
      render: (e) => <span className="text-ink-muted">{e.vacancies[0]?.vacancyTitle ?? "Sin postulaciones"}</span>,
    },
    {
      key: "career",
      header: "Carrera",
      render: (e) => <span className="text-ink-muted">{e.career}</span>,
    },
    {
      key: "technologies",
      header: "Tecnologías",
      render: (e) => {
        const technologies = getTechnologies(e);
        if (technologies.length === 0) {
          return (
            <span className="text-xs text-ink-subtle">
              Sin tecnologías registradas
            </span>
          );
        }

        const target = technology
          ? normalizeTechnology(technology)
          : null;
        const ordered = target
          ? [
              ...technologies.filter(
                (value) => normalizeTechnology(value) === target,
              ),
              ...technologies.filter(
                (value) => normalizeTechnology(value) !== target,
              ),
            ]
          : technologies;
        const visible = ordered.slice(0, 4);
        const hidden = ordered.slice(visible.length);

        return (
          <div className="flex max-w-[280px] flex-wrap items-center gap-1">
            {visible.map((value) => {
              const isMatch =
                target !== null && normalizeTechnology(value) === target;
              return (
                <span
                  key={normalizeTechnology(value)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    isMatch
                      ? "bg-primary-100 text-primary-800 border-primary-300 font-semibold"
                      : "bg-primary-50 text-primary-700 border-primary-100",
                  )}
                  title={value}
                >
                  {value}
                </span>
              );
            })}
            {hidden.length > 0 && (
              <span
                className="text-[11px] font-medium text-ink-subtle"
                title={hidden.join(", ")}
              >
                +{hidden.length}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (e) => <span className="text-ink-muted">{e.phone}</span>,
    },
    ...additionalColumns,
    {
      key: "match",
      header: "Match",
      align: "center",
      render: (e) => {
        const application = e.vacancies[0];
        if (application?.matchPercent == null) return <span className="text-ink-subtle">-</span>;
        return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MATCH_COLORS(application.matchPercent))}>{application.matchPercent}%</span>;
      },
    },
    {
      key: "talentPool",
      header: "Banco de talento",
      align: "center",
      render: (e) => {
        if (e.inTalentPool) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              <Check className="h-3 w-3 text-success" />
              En banco
            </span>
          );
        }

        const isAdding =
          addingCandidateId === e.id || isAddingToTalentPool;

        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isAdding}
            onClick={(event) => {
              event.stopPropagation();
              onAddToTalentPool?.(e);
            }}
            className="h-7 text-xs font-medium gap-1 text-primary-700 border-primary-200 hover:bg-primary-50 hover:text-primary-800"
          >
            <Plus className="h-3 w-3" />
            {addingCandidateId === e.id ? "Agregando…" : "Agregar"}
          </Button>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (e) => renderStatus ? renderStatus(e) : (
        <Badge variant={e.isActive ? "success" : "neutral"}>
          {e.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "cv",
      header: "CV",
      align: "center",
      width: "w-[96px]",
      render: (e) =>
        e.cvFileId ? (
          <CandidateCvActions
            fileId={e.cvFileId}
            compact
            subject={e.candidateName}
          />
        ) : (
          <span
            className="text-xs text-ink-subtle"
            title="El candidato no ha subido su hoja de vida."
          >
            Sin CV
          </span>
        ),
    },
  ];

  return <DataTable {...tableProps} columns={onAddToTalentPool ? columns : columns.filter((column) => column.key !== "talentPool")} rowKey={(entry) => entry.rowId} />;
}
