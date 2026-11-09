"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";

import { Pagination } from "@/design-system/molecules/Pagination";
import { Badge } from "@/design-system/ui/badge";
import { Button } from "@/design-system/ui/button";
import { DataTable, type ColumnDef } from "@/design-system/organisms/DataTable";
import { FilterBar } from "@/design-system/molecules/FilterBar";
import { Combobox } from "@/design-system/molecules/Combobox";
import { Avatar } from "@/design-system/atoms/Avatar";
import { cn } from "@/shared/utils";
import { ROUTES } from "@/shared/constants/routes";
import {
  useCandidateDirectory,
  useAddToTalentPool,
} from "../hooks/useCandidates";
import { useCandidateDirectoryNavStore } from "@/shared/stores/candidateDirectoryNavStore";
import { CandidateCvActions } from "./CandidateCvActions";
import { SalaryRangeFilter, salaryValue } from "./SalaryRangeFilter";
import { getCandidateDirectoryRows, type CandidateDirectoryRow } from "../directoryRows";
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

interface UnifiedCandidateFilters {
  city?: string;
  salaryFrom?: string;
  salaryTo?: string;
  search: string;
  career: string | null;
  vacancyId: string | null;
  status: string;
  technology: string | null;
}

export function CandidatesPage() {
  const router = useRouter();
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useCandidateDirectory();
  const addToTalentPoolMutation = useAddToTalentPool();
  const setNavEntries = useCandidateDirectoryNavStore((s) => s.setEntries);

  const [addingCandidateId, setAddingCandidateId] = useState<string | null>(
    null,
  );

  const filters = useCandidateDirectoryNavStore((s) => s.filters);
  const updateFilters = useCandidateDirectoryNavStore((s) => s.setFilters);
  const page = useCandidateDirectoryNavStore((s) => s.page);
  const setPage = useCandidateDirectoryNavStore((s) => s.setPage);
  const setFilters = (value: UnifiedCandidateFilters | ((previous: UnifiedCandidateFilters) => UnifiedCandidateFilters)) =>
    updateFilters(typeof value === "function" ? value(filters) : value);

  const careers = useMemo(() => {
    return Array.from(
      new Set(entries.map((e) => e.career).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const cities = useMemo(() => {
    const unique = new Map<string, string>();
    for (const entry of entries) {
      const city = entry.city?.trim();
      if (city) unique.set(normalizeTechnology(city), city);
    }
    return Array.from(unique, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [entries]);

  const vacancies = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      for (const v of e.vacancies) {
        if (!map.has(v.vacancyId)) {
          map.set(v.vacancyId, v.vacancyTitle);
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
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
    filters.city || filters.salaryFrom || filters.salaryTo ||
    filters.search ||
    filters.career ||
    filters.vacancyId ||
    filters.status ||
    filters.technology,
  );

  const resetFilters = () => {
    setFilters({
      city: "",
      salaryFrom: "",
      salaryTo: "",
      search: "",
      career: null,
      vacancyId: null,
      status: "",
      technology: null,
    });
  };

  const handleAddToTalentPool = async (candidate: CandidateDirectoryEntry) => {
    if (addingCandidateId) return;
    setAddingCandidateId(candidate.id);
    try {
      const sourceVacancyId =
        filters.vacancyId || (candidate.vacancies.length === 1 ? candidate.vacancies[0].vacancyId : null);
      await addToTalentPoolMutation.mutateAsync({
        candidateId: candidate.id,
        vacancyId: sourceVacancyId,
      });
    } catch (err) {
      console.error("Error al agregar al banco de talento:", err);
    } finally {
      setAddingCandidateId(null);
    }
  };

  const filtered = useMemo(() => {
    return getCandidateDirectoryRows(entries)
      .sort((a, b) => Number(b.id) - Number(a.id))
      .filter((e) => {
        if (filters.city && !normalizeTechnology(e.city ?? "").includes(normalizeTechnology(filters.city))) return false;
        const from = salaryValue(filters.salaryFrom);
        const to = salaryValue(filters.salaryTo);
        if (from !== null && to !== null && from > to) return false;
        if (from !== null || to !== null) {
          const salary = e.vacancies[0]?.salaryExpectation;
          if (salary == null || (from !== null && salary < from) || (to !== null && salary > to)) return false;
        }
        const q = filters.search.trim().toLowerCase();
        if (q) {
          const matchName = e.candidateName.toLowerCase().includes(q);
          const matchCareer = (e.career ?? "").toLowerCase().includes(q);
          const matchEmail = e.email?.toLowerCase().includes(q);
          const matchPhone = e.phone?.toLowerCase().includes(q);
          const matchVacancy = e.vacancies.some((v) =>
            v.vacancyTitle.toLowerCase().includes(q),
          );
          const matchSkill = e.skills?.some((s) => s.toLowerCase().includes(q));
          const matchTool = e.tools?.some((t) => t.toLowerCase().includes(q));
          if (
            !matchName &&
            !matchCareer &&
            !matchEmail &&
            !matchPhone &&
            !matchVacancy &&
            !matchSkill &&
            !matchTool
          ) {
            return false;
          }
        }

        if (filters.career && e.career !== filters.career) return false;
        if (
          filters.vacancyId &&
          !e.vacancies.some((v) => v.vacancyId === filters.vacancyId)
        ) {
          return false;
        }
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

  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount - 1);
  const paginated = filtered.slice(currentPage * 10, (currentPage + 1) * 10);

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
          addingCandidateId === e.id || addToTalentPoolMutation.isPending;

        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isAdding}
            onClick={(event) => {
              event.stopPropagation();
              handleAddToTalentPool(e);
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
      render: (e) => (
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Candidatos</h1>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          <span>No se pudieron cargar los candidatos: {error.message}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

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
          aria-label="Filtrar por vacante postulada"
          placeholder="Vacante postulada"
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

        <Combobox
          aria-label="Filtrar por ciudad"
          placeholder="Ciudad"
          className="w-auto min-w-[170px]"
          value={filters.city ?? ""}
          onChange={(city) => setFilters((f) => ({ ...f, city }))}
          options={cities}
        />

        <SalaryRangeFilter
          from={filters.salaryFrom}
          to={filters.salaryTo}
          onChange={(range) => setFilters((f) => ({ ...f, ...range }))}
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
        data={paginated}
        rowKey={(e) => e.rowId}
        isLoading={isLoading}
        onRowClick={(entry) => {
          const idx = filtered.indexOf(entry);
          setNavEntries(
            filtered.map((e) => ({
              candidateId: e.id,
              applicationId: e.applicationId,
              vacancyId: e.vacancies[0]?.vacancyId,
              tpId: e.talentPoolEntryId,
            })),
          );
          router.push(
            ROUTES.candidatoDetalle(entry.id, {
              pos: idx + 1,
              total: filtered.length,
              vacancyId: entry.vacancies[0]?.vacancyId,
              appId: entry.applicationId,
              tpId: entry.talentPoolEntryId ?? undefined,
            }),
          );
        }}
        emptyState={{
          title: error
            ? "No se pudo cargar el directorio."
            : "Sin resultados para los filtros seleccionados.",
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-muted">
          Mostrando {filtered.length ? currentPage * 10 + 1 : 0} a {Math.min((currentPage + 1) * 10, filtered.length)} de {filtered.length} registros
        </div>
        <Pagination className="ml-auto" page={currentPage} pageCount={pageCount}
          onPrev={() => setPage(currentPage - 1)} onNext={() => setPage(currentPage + 1)} />
      </div>
    </div>
  );
}
