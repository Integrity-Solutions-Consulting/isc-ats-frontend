"use client";

import { Search } from "lucide-react";

import { Input } from "@/design-system/ui/input";
import { Combobox } from "@/design-system/molecules/Combobox";
import { STATUS_LABEL } from "../labels";
import type {
  CatalogOption,
  SeniorityLevel,
  VacancyFilters as Filters,
  VacancyStatus,
} from "../types";

interface VacancyFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  clients: CatalogOption[];
  departments: CatalogOption[];
  levels: CatalogOption[];
}

const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [VacancyStatus, string][];

const STATUS_COMBO_OPTIONS = [
  { id: "", label: "Todas" },
  ...STATUS_OPTIONS.map(([value, label]) => ({ id: value, label })),
];

type AuditStatus = Filters["isActiveFilter"];

/**
 * `satisfies` keeps this list and the `isActiveFilter` union tied together: add
 * an option the union does not know about and this line stops compiling, rather
 * than the list silently falling through every branch of the audit filter.
 */
const AUDIT_STATUS_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "active", label: "Activo" },
  { id: "inactive", label: "Inactivo" },
] satisfies { id: "" | Exclude<AuditStatus, "all">; label: string }[];

/**
 * `Combobox` is typed to emit a plain string, so the value is narrowed against
 * the options themselves before it reaches the filter state. In `id` mode it
 * only ever emits an option id, making this a boundary check — one that keeps
 * the current selection instead of widening the list on an unknown value.
 */
function isAuditStatus(id: string): id is AuditStatus {
  return id === "all" || AUDIT_STATUS_OPTIONS.some((option) => option.id === id && id !== "");
}

export function VacancyFilters({
  filters,
  onChange,
  clients,
  departments,
  levels,
}: VacancyFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-2 p-3">
      <div className="min-w-[240px] flex-1">
        <label htmlFor="vacancy-filter-search" className="mb-1 block text-sm font-medium text-ink-muted">Vacante</label>
        <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          id="vacancy-filter-search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value.replace(/[^\p{L}\p{M} ]/gu, "") })}
          placeholder="Buscar por nombre de vacante…"
          className="pl-9"
        />
        </div>
      </div>

      <div>
      <label htmlFor="vacancy-filter-client" className="mb-1 block text-sm font-medium text-ink-muted">Cliente</label>
      <Combobox
        id="vacancy-filter-client"
        valueKey="id"
        aria-label="Filtrar por cliente"
        placeholder="Cliente"
        emptyValueShowsPlaceholder
        clearSearchOnOpen
        className="w-auto min-w-[180px]"
        value={filters.clientCompany ?? ""}
        onChange={(id) => onChange({ clientCompany: id || null })}
        options={[{ id: "", label: "Todos" }, ...clients]}
      />
      </div>

      <div>
      <label htmlFor="vacancy-filter-department" className="mb-1 block text-sm font-medium text-ink-muted">Departamento</label>
      <Combobox
        id="vacancy-filter-department"
        valueKey="id"
        selectOnly
        aria-label="Filtrar por departamento"
        placeholder="Departamento"
        emptyValueShowsPlaceholder
        className="w-auto min-w-[180px]"
        value={filters.department ?? ""}
        onChange={(id) => onChange({ department: id || null })}
        options={[{ id: "", label: "Todos" }, ...departments]}
      />
      </div>

      <div>
      <label htmlFor="vacancy-filter-situation" className="mb-1 block text-sm font-medium text-ink-muted">Situación</label>
      <Combobox
        id="vacancy-filter-situation"
        valueKey="id"
        selectOnly
        aria-label="Filtrar por situación"
        placeholder="Situación"
        emptyValueShowsPlaceholder
        className="w-auto min-w-[150px]"
        value={filters.status ?? ""}
        onChange={(id) => onChange({ status: (id || null) as VacancyStatus | null })}
        options={STATUS_COMBO_OPTIONS}
      />
      </div>

      <div>
      <label htmlFor="vacancy-filter-level" className="mb-1 block text-sm font-medium text-ink-muted">Nivel</label>
      <Combobox
        id="vacancy-filter-level"
        valueKey="id"
        selectOnly
        aria-label="Filtrar por nivel"
        placeholder="Nivel"
        emptyValueShowsPlaceholder
        className="w-auto min-w-[150px]"
        value={filters.level ?? ""}
        onChange={(id) => onChange({ level: (id || null) as SeniorityLevel | null })}
        options={[{ id: "", label: "Todos" }, ...levels]}
      />
      </div>

      <div>
      <label htmlFor="vacancy-filter-status" className="mb-1 block text-sm font-medium text-ink-muted">Estado</label>
      <Combobox
        id="vacancy-filter-status"
        valueKey="id"
        selectOnly
        aria-label="Filtrar por estado de auditoría"
        placeholder="Estado"
        emptyValueShowsPlaceholder
        className="w-auto min-w-[150px]"
        value={filters.isActiveFilter === "all" ? "" : filters.isActiveFilter}
        onChange={(id) => {
          const status = id || "all";
          if (isAuditStatus(status)) onChange({ isActiveFilter: status });
        }}
        options={AUDIT_STATUS_OPTIONS}
      />
      </div>
    </div>
  );
}
