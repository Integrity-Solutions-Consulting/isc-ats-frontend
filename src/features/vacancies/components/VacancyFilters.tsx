"use client";

import { Search } from "lucide-react";

import { Input } from "@/design-system/ui/input";
import { Select } from "@/design-system/atoms/Select";
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

export function VacancyFilters({
  filters,
  onChange,
  clients,
  departments,
  levels,
}: VacancyFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Buscar por nombre de vacante…"
          className="pl-9"
        />
      </div>

      <Select
        aria-label="Filtrar por cliente"
        className="w-auto min-w-[180px]"
        value={filters.clientCompany ?? ""}
        onChange={(e) => onChange({ clientCompany: e.target.value || null })}
      >
        <option value="">Cliente: Todos</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por departamento"
        className="w-auto min-w-[180px]"
        value={filters.department ?? ""}
        onChange={(e) => onChange({ department: e.target.value || null })}
      >
        <option value="">Departamento: Todos</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por situación"
        className="w-auto min-w-[150px]"
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({ status: (e.target.value || null) as VacancyStatus | null })
        }
      >
        <option value="">Situación: Todas</option>
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por nivel"
        className="w-auto min-w-[150px]"
        value={filters.level ?? ""}
        onChange={(e) =>
          onChange({ level: (e.target.value || null) as SeniorityLevel | null })
        }
      >
        <option value="">Nivel: Todos</option>
        {levels.map((lvl) => (
          <option key={lvl.id} value={lvl.id}>
            {lvl.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por estado de auditoría"
        className="w-auto min-w-[150px]"
        value={filters.isActiveFilter}
        onChange={(e) =>
          onChange({ isActiveFilter: e.target.value as any })
        }
      >
        <option value="active">Estado: Activo</option>
        <option value="inactive">Estado: Inactivo</option>
        <option value="all">Estado: Todos</option>
      </Select>
    </div>
  );
}
