"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { CandidatesTable } from "./CandidatesTable";
import { Pagination } from "@/design-system/molecules/Pagination";
import { Button } from "@/design-system/ui/button";
import { Input } from "@/design-system/ui/input";
import { DataTable, type ColumnDef } from "@/design-system/organisms/DataTable";
import { FilterBar } from "@/design-system/molecules/FilterBar";
import { Combobox } from "@/design-system/molecules/Combobox";
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

interface UnifiedCandidateFilters {
  matchMin?: string;
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
    filters.matchMin ||
    filters.city || filters.salaryFrom || filters.salaryTo ||
    filters.search ||
    filters.career ||
    filters.vacancyId ||
    filters.status ||
    filters.technology,
  );

  const resetFilters = () => {
    setFilters({
      matchMin: "",
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
        if (filters.matchMin !== undefined && filters.matchMin !== "") {
          const match = e.vacancies[0]?.matchPercent;
          if (match == null || match < Number(filters.matchMin)) return false;
        }
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

        <div className="relative w-[120px]">
          <Input
            type="text"
            inputMode="numeric"
            aria-label="Filtrar por match mínimo"
            placeholder="Match"
            value={filters.matchMin ?? ""}
            className="pr-8"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || (/^\d+$/.test(value) && Number(value) <= 100)) {
                setFilters((f) => ({ ...f, matchMin: value === "" ? "" : String(Number(value)) }));
              }
            }}
          />
          <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">%</span>
        </div>

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

      <CandidatesTable
        technology={filters.technology}
        addingCandidateId={addingCandidateId}
        isAddingToTalentPool={addToTalentPoolMutation.isPending}
        onAddToTalentPool={handleAddToTalentPool}
        data={paginated}
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
