"use client";

import { useFormContext } from "react-hook-form";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/design-system/ui/button";
import { Input } from "@/design-system/ui/input";
import { Label } from "@/design-system/ui/label";
import { Select } from "@/design-system/atoms/Select";
import { cn } from "@/shared/utils";
import { useVacancyCatalogs } from "../../hooks/useVacancies";
import type { VacancyFormValues } from "../../types";
import { Section, RequiredLabel } from "./FormSection";

export function SelectionSection() {
  const { data: catalogs } = useVacancyCatalogs();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  const level = watch("level");
  const openings = watch("openings");

  return (
    <Section num={3} title="Proceso de selección y nivel">
      <div className="mb-4">
        <RequiredLabel htmlFor="process">Proceso de selección</RequiredLabel>
        <Select
          id="process"
          className="mt-1.5"
          aria-invalid={!!errors.process}
          {...register("process")}
        >
          <option value="">Selecciona…</option>
          {catalogs?.processes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
        {errors.process && (
          <p className="mt-1 text-xs text-danger">{errors.process.message}</p>
        )}
      </div>

      <Label>Nivel del recurso y cantidad</Label>
      <div className="mt-1.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(catalogs?.resourceLevels ?? []).map((lvl) => {
          const active = level === lvl.id;
          return (
            <div
              key={lvl.id}
              role="button"
              tabIndex={0}
              onClick={() => setValue("level", lvl.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setValue("level", lvl.id);
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary-600 bg-primary-50"
                  : "border-border hover:bg-surface-2",
              )}
            >
              <span className="text-sm font-semibold text-ink">
                {lvl.label}
              </span>
              {active && (
                <div
                  className="mt-2 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-ink-muted">recursos:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label="Quitar uno"
                    onClick={() => setValue("openings", Math.max(1, openings - 1))}
                  >
                    <Minus />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-7 w-12 px-1 text-sm text-center font-semibold"
                    value={openings}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setValue("openings", isNaN(val) || val < 1 ? 1 : val);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label="Agregar uno"
                    onClick={() => setValue("openings", openings + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Label htmlFor="experienceYears" className="shrink-0">
          Años mínimos de experiencia
        </Label>
        <Input
          id="experienceYears"
          type="text"
          inputMode="numeric"
          className="w-20"
          placeholder="0"
          {...register("experienceYears", {
            setValueAs: (v) => (v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0)),
          })}
        />
        <span className="text-sm text-ink-muted">años</span>
        {errors.experienceYears && (
          <p className="text-xs text-danger">{errors.experienceYears.message}</p>
        )}
      </div>
    </Section>
  );
}
