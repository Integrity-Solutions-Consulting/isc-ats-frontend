"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/design-system/ui/badge";
import { Button } from "@/design-system/ui/button";
import { DataTable, type ColumnDef } from "@/design-system/organisms/DataTable";
import { FilterBar } from "@/design-system/molecules/FilterBar";
import { Combobox } from "@/design-system/molecules/Combobox";
import { Avatar } from "@/design-system/atoms/Avatar";
import { cn } from "@/shared/utils";
import { ROUTES } from "@/shared/constants/routes";
import { useTalentPool } from "../hooks/useTalentPool";
import { useTalentPoolNavStore } from "@/shared/stores/talentPoolNavStore";
import type { TalentPoolEntry, TalentPoolFilters } from "../types";

// Unifica diferencias de mayúsculas y espacios; conserva distinciones como C# / C++.
const normalizeTechnology = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");

const getTechnologies = (entry: TalentPoolEntry): string[] => {
  const unique = new Map<string, string>();
  for (const value of [...(entry.skills ?? []), ...(entry.tools ?? [])]) {
    const label = value.trim().replace(/\s+/g, " ");
    if (label && !unique.has(normalizeTechnology(label))) {
      unique.set(normalizeTechnology(label), label);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, "es"));
};

// El cambio queda contenido en esta página; no altera el contrato de la API.
type UnifiedTalentPoolFilters = Omit<TalentPoolFilters, "skill" | "tool"> & {
  technology: string | null;
};

const MATCH_COLORS = (pct: number) => {
  if (pct >= 75) return "text-success bg-success/10";
  if (pct >= 50) return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
};

export function TalentPoolPage() {
  const router = useRouter();
  const { data: entries = [], isLoading } = useTalentPool();
  const setNavEntries = useTalentPoolNavStore((s) => s.setEntries);

  const [filters, setFilters] = useState<UnifiedTalentPoolFilters>({
    search: "",
    career: null,
    vacancyId: null,
    status: "",
    technology: null,
  });

  const careers = useMemo(() => {
    return Array.from(
      new Set(entries.map((e) => e.career).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const vacancies = useMemo(() => {
    return Array.from(
      new Map(
        entries
          .filter((e) => e.vacancyId)
          .map((e) => [e.vacancyId, e.vacancyTitle]),
      ).entries(),
    ).sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const availableTechnologies = useMemo(() => {
    const unique = new Map<string, string>();
    for (const entry of entries) {
      for (const label of getTechnologies(entry)) {
        const id = normalizeTechnology(label);
        if (!unique.has(id)) unique.set(id, label);
      }
    }
    return Array.from(unique, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "es"),
    );
  }, [entries]);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.career ||
    filters.vacancyId ||
    filters.status ||
    filters.technology,
  );

  const resetFilters = () => {
    setFilters({
      search: "",
      career: null,
      vacancyId: null,
      status: "",
      technology: null,
    });
  };

  const filtered = useMemo(() => {
    return [...entries]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .filter((e) => {
        const q = filters.search.trim().toLowerCase();
        if (q) {
          const matchName = e.candidateName.toLowerCase().includes(q);
          const matchCareer = (e.career ?? "").toLowerCase().includes(q);
          const matchEmail = e.email?.toLowerCase().includes(q);
          const matchVacancy = e.vacancyTitle?.toLowerCase().includes(q);
          const matchSkill = e.skills?.some((s) => s.toLowerCase().includes(q));
          const matchTool = e.tools?.some((t) => t.toLowerCase().includes(q));
          if (
            !matchName &&
            !matchCareer &&
            !matchEmail &&
            !matchVacancy &&
            !matchSkill &&
            !matchTool
          ) {
            return false;
          }
        }

        if (filters.career && e.career !== filters.career) return false;
        if (filters.vacancyId && e.vacancyId !== filters.vacancyId)
          return false;
        if (filters.status === "active" && !e.isActive) return false;
        if (filters.status === "inactive" && e.isActive) return false;

        if (filters.technology) {
          const target = normalizeTechnology(filters.technology);
          if (
            !getTechnologies(e).some(
              (value) => normalizeTechnology(value) === target,
            )
          ) {
            return false;
          }
        }

        return true;
      });
  }, [entries, filters]);

  const columns: ColumnDef<TalentPoolEntry>[] = [
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
      key: "vacancyTitle",
      header: "Vacante de origen",
      render: (e) => <span className="text-ink-muted">{e.vacancyTitle}</span>,
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

        // Si la tecnología seleccionada estaba oculta, muéstrala primero.
        const target = filters.technology
          ? normalizeTechnology(filters.technology)
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
    {
      key: "email",
      header: "Correo",
      render: (e) => <span className="text-ink-muted">{e.email}</span>,
    },
    {
      key: "match",
      header: "Match",
      align: "right",
      render: (e) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            MATCH_COLORS(e.matchPercent),
          )}
        >
          {e.matchPercent}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (e) => (
        <Badge variant={e.isActive ? "success" : "neutral"}>
          {e.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Banco de talento</h1>

      {/* Filters */}
      <FilterBar
        search={{
          value: filters.search,
          onChange: (value) => setFilters((f) => ({ ...f, search: value })),
          placeholder: "Buscar candidato, carrera, tecnología…",
        }}
      >
        <Combobox
          valueKey="id"
          aria-label="Filtrar por tecnología"
          placeholder="Tecnología"
          emptyValueShowsPlaceholder
          clearSearchOnOpen
          className="w-auto min-w-[190px]"
          value={filters.technology ?? ""}
          onChange={(value) =>
            setFilters((f) => ({ ...f, technology: value || null }))
          }
          options={[{ id: "", label: "Todas" }, ...availableTechnologies]}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por carrera"
          placeholder="Carrera"
          emptyValueShowsPlaceholder
          clearSearchOnOpen
          className="w-auto min-w-[170px]"
          value={filters.career ?? ""}
          onChange={(value) =>
            setFilters((f) => ({ ...f, career: value || null }))
          }
          options={[
            { id: "", label: "Todas" },
            ...careers.map((c) => ({ id: c, label: c })),
          ]}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por vacante de origen"
          placeholder="Vacante de origen"
          emptyValueShowsPlaceholder
          clearSearchOnOpen
          className="w-auto min-w-[190px]"
          value={filters.vacancyId ?? ""}
          onChange={(value) =>
            setFilters((f) => ({ ...f, vacancyId: value || null }))
          }
          options={[
            { id: "", label: "Todas" },
            ...vacancies.map(([id, title]) => ({ id, label: title })),
          ]}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por estado"
          placeholder="Estado"
          emptyValueShowsPlaceholder
          clearSearchOnOpen
          className="w-auto min-w-[140px]"
          value={filters.status}
          onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
          options={[
            { id: "", label: "Todos" },
            { id: "active", label: "Activo" },
            { id: "inactive", label: "Inactivo" },
          ]}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs text-ink-muted hover:text-ink gap-1.5 h-9"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        onRowClick={(entry) => {
          const idx = filtered.indexOf(entry);
          setNavEntries(
            filtered.map((e) => ({ candidateId: e.candidateId, tpId: e.id })),
          );
          router.push(
            ROUTES.bancoTalentoCandidate(entry.candidateId, {
              pos: idx + 1,
              total: filtered.length,
              tpId: entry.id,
            }),
          );
        }}
        emptyState={{ title: "Sin resultados para los filtros seleccionados." }}
      />

      <div className="text-sm text-ink-muted">
        Mostrando {filtered.length} de{" "}
        <span className="font-medium text-ink">{entries.length}</span> candidato
        {entries.length !== 1 ? "s" : ""} guardado
        {entries.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
