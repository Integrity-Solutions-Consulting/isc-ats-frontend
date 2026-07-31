"use client";

import { useFormContext } from "react-hook-form";

import type { VacancyFormValues } from "../../types";
import { Section, RequiredLabel } from "./FormSection";

interface DescriptionSectionProps {
  readOnly?: boolean;
}

export function DescriptionSection({ readOnly = false }: DescriptionSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  return (
    <Section num={5} title="Descripción del cargo">
      <RequiredLabel htmlFor="description">Descripción del cargo</RequiredLabel>
      <textarea
        id="description"
        rows={6}
        className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-ink-subtle focus-visible:border-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Responsabilidades, beneficios y requisitos de aplicación."
        aria-invalid={!!errors.description}
        disabled={readOnly}
        {...register("description")}
      />
      {errors.description && (
        <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
      )}
    </Section>
  );
}
