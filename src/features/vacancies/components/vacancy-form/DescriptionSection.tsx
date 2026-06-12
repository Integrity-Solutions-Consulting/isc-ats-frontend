"use client";

import { useFormContext } from "react-hook-form";

import type { VacancyFormValues } from "../../types";
import { Section } from "./FormSection";

export function DescriptionSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  return (
    <Section num={5} title="Descripción del cargo">
      <textarea
        rows={6}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-ink-subtle focus-visible:border-primary-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        placeholder="Responsabilidades, beneficios y requisitos de aplicación."
        aria-invalid={!!errors.description}
        {...register("description")}
      />
      {errors.description && (
        <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
      )}
    </Section>
  );
}
