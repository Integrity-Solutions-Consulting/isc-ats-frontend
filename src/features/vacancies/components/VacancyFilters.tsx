"use client";

import { Search } from "lucide-react";

import { Input } from "@/design-system/ui/input";
import { Combobox } from "@/design-system/molecules/Combobox";
import { LEVEL_LABEL, STATUS_LABEL } from "../labels";
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
  { id: "", label: "Situación: Todas" },
  ...STATUS_OPTIONS.map(([value, label]) => ({ id: value, label })),
];

const AUDIT_STATUS_OPTIONS = [
  { id: "active", label: "Estado: Activo" },
  { id: "inactive", label: "Estado: Inactivo" },
  { id: "all", label: "Estado: Todos" },
];

export function VacancyFilters({
  filters,
  onChange,
  clients,
  departments,
  levels,
}: VacancyFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 p-3">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Buscar por nombre de vacante…"
          className="pl-9"
        />
      </div>

      <Combobox
        valueKey="id"
        aria-label="Filtrar por cliente"
        className="w-auto min-w-[180px]"
        value={filters.clientCompany ?? ""}
        onChange={(id) => onChange({ clientCompany: id || null })}
        options={[{ id: "", label: "Cliente: Todos" }, ...clients]}
      />

      <Combobox
        valueKey="id"
        aria-label="Filtrar por departamento"
        className="w-auto min-w-[180px]"
        value={filters.department ?? ""}
        onChange={(id) => onChange({ department: id || null })}
        options={[{ id: "", label: "Departamento: Todos" }, ...departments]}
      />

      <Combobox
        valueKey="id"
        aria-label="Filtrar por situación"
        className="w-auto min-w-[150px]"
        value={filters.status ?? ""}
        onChange={(id) => onChange({ status: (id || null) as VacancyStatus | null })}
        options={STATUS_COMBO_OPTIONS}
      />

      <Combobox
        valueKey="id"
        aria-label="Filtrar por nivel"
        className="w-auto min-w-[150px]"
        value={filters.level ?? ""}
        onChange={(id) => onChange({ level: (id || null) as SeniorityLevel | null })}
        options={[{ id: "", label: "Nivel: Todos" }, ...levels]}
      />

      <Combobox
        valueKey="id"
        aria-label="Filtrar por estado de auditoría"
        className="w-auto min-w-[150px]"
        value={filters.isActiveFilter}
        onChange={(id) => onChange({ isActiveFilter: id as any })}
        options={AUDIT_STATUS_OPTIONS}
      />
    </div>
  );
}
