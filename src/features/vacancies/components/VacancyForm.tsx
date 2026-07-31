"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { vacancyKeys } from "../hooks/useVacancies";

import { Button } from "@/design-system/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { PERM } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/PermissionsProvider";
import { createVacancy, updateVacancy } from "../api/vacanciesApi";
import { EMPTY_VACANCY_FORM, makeVacancySchema } from "../formSchema";
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
  const { has } = usePermissions();
  // Whoever can publish also decides the selection process up front; a
  // solicitud (non-publisher save) has none yet, so the field isn't required
  // for them. See formSchema.ts.
  const canPublish = has(PERM.vacanciesPublish);
  const canCreate = has(PERM.vacanciesCreate);
  const canUpdate = has(PERM.vacanciesUpdate);
  // Field editability mirrors the backend's own gate: PATCH /vacancies/{id}
  // requires recruitment.vacancies.update (vacancies_routes.py), so that's the
  // permission that decides whether an edit-mode form is writable — not some
  // derived combination of create/publish. Create mode is unaffected (the
  // create route already requires vacanciesCreate to be reached at all).
  const readOnly = mode === "edit" && !canUpdate;
  const [pending, setPending] = useState<null | "solicitud" | "publish">(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => makeVacancySchema(canPublish), [canPublish]);
  // Solicitud saves never require `process`, regardless of who's saving
  // (Admin can both publish AND save a bare solicitud) — see formSchema.ts.
  const solicitudSchema = useMemo(() => makeVacancySchema(false), []);

  const methods = useForm<VacancyFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: initialValues ?? EMPTY_VACANCY_FORM,
  });
  const { handleSubmit, getValues, setError } = methods;

  // Never surface a raw backend/proxy error message (e.g. internal catalog
  // ids) in the UI — always a fixed, friendly copy instead. The real error is
  // still logged for debugging.
  const FRIENDLY_SAVE_ERROR =
    "No se pudo guardar la vacante. Verifica los datos e inténtalo de nuevo.";

  async function persist(values: VacancyFormValues, status: "solicitud" | "active") {
    if (mode === "edit" && vacancyId) {
      return updateVacancy(vacancyId, values, status);
    }
    return createVacancy(values, status);
  }

  async function onPublish(values: VacancyFormValues) {
    // Defense in depth: the Publicar button is hidden without vacanciesPublish,
    // but the form's Enter-key submit still routes here — fall back to the
    // solicitud save instead of attempting a publish this user can't perform.
    // (Description and every other field are already enforced by `schema` via
    // the resolver before onPublish even runs.)
    if (!canPublish) {
      return onSaveSolicitud();
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
      console.error("Error publishing vacancy:", error);
      setSubmitError(FRIENDLY_SAVE_ERROR);
      setPending(null);
    }
  }

  async function onSaveSolicitud() {
    const values = getValues();
    // Solicitud saves skip the form's zodResolver (that one requires
    // `process`), so validate everything else against the process-optional
    // schema here — every field but process/template must still be filled in.
    const result = solicitudSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof VacancyFormValues, { message: issue.message });
        }
      }
      return;
    }
    setSubmitError(null);
    setPending("solicitud");
    try {
      await persist(values, "solicitud");
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      if (vacancyId) {
        queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(vacancyId) });
      }
      router.push(ROUTES.vacantes);
      router.refresh();
    } catch (error) {
      console.error("Error saving vacancy solicitud:", error);
      setSubmitError(FRIENDLY_SAVE_ERROR);
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

        <BasicInfoSection readOnly={readOnly} />
        <LocationSection readOnly={readOnly} />
        <SelectionSection readOnly={readOnly} />
        <ProfileSection readOnly={readOnly} />
        <DescriptionSection readOnly={readOnly} />

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
          {canCreate && (
            <Button
              type="button"
              variant={canPublish ? "outline" : "default"}
              onClick={onSaveSolicitud}
              disabled={pending !== null}
            >
              {pending === "solicitud" && <Loader2 className="size-4 animate-spin" />}
              Guardar solicitud
            </Button>
          )}
          {canPublish && (
            <Button type="submit" disabled={pending !== null}>
              {pending === "publish" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send />
              )}
              Publicar vacante
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
