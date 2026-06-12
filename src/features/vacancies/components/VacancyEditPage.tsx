"use client";

import { Loader2 } from "lucide-react";

import { EmptyState } from "@/design-system/molecules/EmptyState";
import { VacancyForm } from "./VacancyForm";
import { useVacancy } from "../hooks/useVacancies";
import type { Vacancy, VacancyFormValues } from "../types";

function toFormValues(v: Vacancy): VacancyFormValues {
  return {
    position: v.position,
    clientCompany: v.clientCompanyId ?? "",
    contact: v.contactId ?? "",
    department: v.departmentId ?? "",
    city: v.cityId ?? "",
    workMode: v.workMode,
    durationYears: v.durationYears,
    durationMonths: v.durationMonths,
    career: v.careerId ?? "",
    process: v.processId ?? "",
    level: v.level,
    openings: v.openings,
    experienceYears: v.experienceYears,
    workSchedule: v.workSchedule,
    requirements: v.requirements,
    description: v.description,
  };
}

export function VacancyEditPage({ id }: { id: string }) {
  const { data, isLoading, isError } = useVacancy(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Cargando vacante…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Vacante no encontrada"
        description="La vacante solicitada no existe o fue eliminada."
      />
    );
  }

  return (
    <VacancyForm
      mode="edit"
      vacancyId={id}
      title="Editar vacante"
      initialValues={toFormValues(data)}
    />
  );
}
