"use client";

import { useFormContext, Controller } from "react-hook-form";

import { Input } from "@/design-system/ui/input";
import { Label } from "@/design-system/ui/label";
import { Combobox } from "@/design-system/molecules/Combobox";
import { cn } from "@/shared/utils";
import { useVacancyCatalogs } from "../../hooks/useVacancies";
import type { VacancyFormValues } from "../../types";
import { Section, RequiredLabel } from "./FormSection";

export function LocationSection() {
  const { data: catalogs } = useVacancyCatalogs();
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  const workMode = watch("workMode");

  const numberField = (name: "durationYears" | "durationMonths") =>
    register(name, {
      setValueAs: (v) =>
        v === "" || v === null || v === undefined ? null : Number(v),
    });

  return (
    <Section num={2} title="Ubicación y modalidad">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="city">Ciudad de trabajo</RequiredLabel>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Combobox
                id="city"
                className="mt-1.5"                valueKey="id"
                options={catalogs?.cities ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona…"
                aria-invalid={!!errors.city}
              />
            )}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-danger">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label>Modalidad de servicio</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(catalogs?.workModes ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setValue("workMode", m.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  workMode === m.id
                    ? "border-primary-600 bg-primary-50 font-medium text-primary-700"
                    : "border-border bg-surface text-ink-muted hover:border-primary-300",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Duración del proyecto</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              className="w-20"
              aria-label="Años"
              {...numberField("durationYears")}
            />
            <span className="text-sm text-ink-muted">año(s)</span>
            <Input
              type="number"
              min={0}
              max={11}
              className="w-20"
              aria-label="Meses"
              {...numberField("durationMonths")}
            />
            <span className="text-sm text-ink-muted">mes(es)</span>
          </div>
        </div>

        <div>
          <RequiredLabel htmlFor="career">Carrera requerida</RequiredLabel>
          <Controller
            name="career"
            control={control}
            render={({ field }) => (
              <Combobox
                id="career"
                className="mt-1.5"                valueKey="id"
                options={catalogs?.careers ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona…"
                aria-invalid={!!errors.career}
              />
            )}
          />
          {errors.career && (
            <p className="mt-1 text-xs text-danger">{errors.career.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label>Horario de trabajo</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="time"
              aria-label="Hora de entrada"
              value={(watch("workSchedule") ?? "").split(" - ")[0] ?? ""}
              onChange={(e) => {
                const end = (watch("workSchedule") ?? "").split(" - ")[1] ?? "";
                setValue("workSchedule", `${e.target.value} - ${end}`);
              }}
              className="h-9 w-32 rounded-md border border-border bg-surface px-3 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1"
            />
            <span className="text-sm text-ink-muted">a</span>
            <input
              type="time"
              aria-label="Hora de salida"
              value={(watch("workSchedule") ?? "").split(" - ")[1] ?? ""}
              onChange={(e) => {
                const start = (watch("workSchedule") ?? "").split(" - ")[0] ?? "";
                setValue("workSchedule", `${start} - ${e.target.value}`);
              }}
              className="h-9 w-32 rounded-md border border-border bg-surface px-3 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
