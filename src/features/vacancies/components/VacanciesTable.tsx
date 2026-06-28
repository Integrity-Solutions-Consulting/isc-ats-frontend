"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/design-system/ui/badge";
import { Pagination } from "@/design-system/molecules/Pagination";
import { DataTable, type ColumnDef } from "@/design-system/organisms/DataTable";
import { usePagedData } from "@/shared/hooks/usePagedData";
import {
  LEVEL_LABEL,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  WORK_MODE_LABEL,
  formatDuration,
} from "../labels";
import type { Vacancy } from "../types";
import { ROUTES } from "@/shared/constants/routes";

const PAGE_SIZE = 8;

const COLUMNS: ColumnDef<Vacancy>[] = [
  {
    header: "Cargo",
    key: "position",
    render: (row) => <div className="font-medium text-ink">{row.position}</div>,
  },
  { header: "Cliente", key: "clientCompany", render: (row) => row.clientCompany },
  { header: "Contacto", key: "contact", render: (row) => row.contact },
  { header: "Departamento", key: "department", render: (row) => row.department },
  {
    header: "Modalidad",
    key: "workMode",
    render: (row) => WORK_MODE_LABEL[row.workMode] ?? row.workMode,
  },
  {
    header: "Nivel · #",
    key: "level",
    render: (row) => (
      <span className="whitespace-nowrap">
        {LEVEL_LABEL[row.level] ?? row.level}
        <span className="text-ink-subtle"> ×{row.openings}</span>
      </span>
    ),
  },
  { header: "Ciudad", key: "city", render: (row) => row.city },
  {
    header: "Duración",
    key: "duration",
    render: (row) => formatDuration(row.durationYears, row.durationMonths),
  },
  {
    header: "Situación",
    key: "status",
    render: (row) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
    ),
  },
  {
    header: "Estado",
    key: "isActive",
    render: (row) => (
      <Badge variant={row.isActive !== false ? "success" : "neutral"}>
        {row.isActive !== false ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export function VacanciesTable({ data }: { data: Vacancy[] }) {
  const router = useRouter();
  const sorted = useMemo(() => [...data].sort((a, b) => Number(b.id) - Number(a.id)), [data]);
  const { pageRows, page, pageCount, goPrev, goNext } = usePagedData(sorted, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        columns={COLUMNS}
        data={pageRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(ROUTES.vacante(row.id))}
        emptyState={{ title: "Sin vacantes" }}
      />

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Mostrando {pageRows.length} de{" "}
          <span className="font-medium text-ink">{data.length}</span> vacantes
        </span>
        <Pagination page={page} pageCount={pageCount} onPrev={goPrev} onNext={goNext} />
      </div>
    </div>
  );
}
