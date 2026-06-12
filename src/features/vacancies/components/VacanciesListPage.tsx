"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Download, Loader2, Plus } from "lucide-react";

import { Button } from "@/design-system/ui/button";
import { EmptyState } from "@/design-system/molecules/EmptyState";
import { VacancyFilters } from "./VacancyFilters";
import { VacanciesTable } from "./VacanciesTable";
import { useVacancies, useVacancyCatalogs } from "../hooks/useVacancies";
import type { VacancyFilters as Filters } from "../types";
import { ROUTES } from "@/shared/constants/routes";

const INITIAL_FILTERS: Filters = {
  search: "",
  clientCompany: null,
  department: null,
  status: null,
  level: null,
  isActiveFilter: "active",
};

export function VacanciesListPage() {
  const { data: vacancies, isLoading, isError } = useVacancies();
  const { data: catalogs } = useVacancyCatalogs();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const onChange = (patch: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const filtered = useMemo(() => {
    if (!vacancies) return [];
    const query = filters.search.trim().toLowerCase();
    const selectedClientLabel = catalogs?.clients?.find(c => c.id === filters.clientCompany)?.label;
    const selectedDeptLabel = catalogs?.departments?.find(d => d.id === filters.department)?.label;

    return vacancies.filter((v) => {
      if (filters.isActiveFilter === "active" && v.isActive === false) return false;
      if (filters.isActiveFilter === "inactive" && v.isActive !== false) return false;
      if (query && !v.position.toLowerCase().includes(query)) return false;
      if (filters.clientCompany && v.clientCompany !== selectedClientLabel)
        return false;
      if (filters.department && v.department !== selectedDeptLabel) return false;
      if (filters.status && v.status !== filters.status) return false;
      if (filters.level && v.level !== filters.level) return false;
      return true;
    });
  }, [vacancies, filters, catalogs]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Vacantes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Download />
            Exportar
          </Button>
          <Button asChild>
            <Link href={ROUTES.vacanteNueva}>
              <Plus />
              Nueva vacante
            </Link>
          </Button>
        </div>
      </div>

      <VacancyFilters
        filters={filters}
        onChange={onChange}
        clients={catalogs?.clients ?? []}
        departments={catalogs?.departments ?? []}
        levels={catalogs?.resourceLevels ?? []}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Cargando vacantes…
        </div>
      ) : isError ? (
        <EmptyState
          title="No se pudieron cargar las vacantes"
          description="Ocurrió un error al obtener la información. Intenta nuevamente."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Sin vacantes"
          description="No hay vacantes que coincidan con los filtros aplicados."
        />
      ) : (
        <VacanciesTable data={filtered} />
      )}
    </div>
  );
}
