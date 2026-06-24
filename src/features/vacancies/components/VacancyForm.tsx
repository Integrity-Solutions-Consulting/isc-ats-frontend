"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { vacancyKeys } from "../hooks/useVacancies";

import { Button } from "@/design-system/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { createVacancy, updateVacancy } from "../api/vacanciesApi";
import { EMPTY_VACANCY_FORM, vacancyFormSchema } from "../formSchema";
import type { VacancyFormValues } from "../types";
import { BasicInfoSection } from "./vacancy-form/BasicInfoSection";
import { LocationSection } from "./vacancy-form/LocationSection";
import { SelectionSection } from "./vacancy-form/SelectionSection";
import { ProfileSection } from "./vacancy-form/ProfileSection";
import { DescriptionSection } from "./vacancy-form/DescriptionSection";

interface VacancyFormProps {
  mode: "create" | "edit";
  title: string;
  vacancyId?: string;
  initialValues?: VacancyFormValues;
}

export function VacancyForm({
  mode,
  title,
  vacancyId,
  initialValues,
}: VacancyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<null | "draft" | "publish">(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancyFormSchema),
    mode: "onTouched",
    defaultValues: initialValues ?? EMPTY_VACANCY_FORM,
  });
  const { handleSubmit, getValues, setError } = methods;

  async function persist(values: VacancyFormValues, status: "draft" | "active") {
    if (mode === "edit" && vacancyId) {
      return updateVacancy(vacancyId, values, status);
    }
    return createVacancy(values, status);
  }

  async function onPublish(values: VacancyFormValues) {
    if (!values.description.trim()) {
      setError("description", {
        message: "Agrega una descripción para publicar la vacante",
      });
      return;
    }
    setSubmitError(null);
    setPending("publish");
    try {
      await persist(values, "active");
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      if (vacancyId) {
        queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(vacancyId) });
      }
      router.push(ROUTES.vacantes);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar",
      );
      setPending(null);
    }
  }

  async function onSaveDraft() {
    const values = getValues();
    if (!values.position.trim()) {
      setError("position", { message: "Ingresa el nombre del cargo" });
      return;
    }
    setSubmitError(null);
    setPending("draft");
    try {
      await persist(values, "draft");
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      if (vacancyId) {
        queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(vacancyId) });
      }
      router.push(ROUTES.vacantes);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar",
      );
      setPending(null);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onPublish)} className="flex flex-1 flex-col gap-5" noValidate>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Volver">
            <Link href={ROUTES.vacantes}>
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        </div>

        <BasicInfoSection />
        <LocationSection />
        <SelectionSection />
        <ProfileSection />
        <DescriptionSection />

        {submitError && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {submitError}
          </p>
        )}

        {/* Save bar — mt-auto pushes to bottom of the flex column */}
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-auto flex items-center justify-end gap-3 border-t border-border bg-surface px-6 py-3">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.vacantes}>Cancelar</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={pending !== null}
          >
            {pending === "draft" && <Loader2 className="size-4 animate-spin" />}
            Guardar borrador
          </Button>
          <Button type="submit" disabled={pending !== null}>
            {pending === "publish" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send />
            )}
            Publicar vacante
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
