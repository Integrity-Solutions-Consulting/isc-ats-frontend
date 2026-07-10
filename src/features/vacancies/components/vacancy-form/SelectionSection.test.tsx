import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { useForm, FormProvider } from "react-hook-form";

import { SelectionSection } from "./SelectionSection";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import { EMPTY_VACANCY_FORM } from "../../formSchema";
import type { VacancyFormValues } from "../../types";

vi.mock("../../hooks/useVacancies", () => ({
  useVacancyCatalogs: () => ({
    data: {
      clients: [], departments: [], cities: [], careers: [], contacts: [],
      processes: [{ id: "1", label: "Proceso estándar" }],
      profileTemplates: [], vacancyNames: [],
      resourceLevels: [{ id: "junior", label: "Junior" }],
      workModes: [],
    },
  }),
}));

function Wrapper({ codes }: { codes: string[] }) {
  const methods = useForm<VacancyFormValues>({ defaultValues: EMPTY_VACANCY_FORM });
  return (
    <PermissionsProvider codes={codes} loaded>
      <FormProvider {...methods}>
        <SelectionSection />
      </FormProvider>
    </PermissionsProvider>
  );
}

describe("SelectionSection — Proceso gating", () => {
  it("does not render the 'Proceso de selección' field for a non-publisher", () => {
    render(<Wrapper codes={[]} />);
    expect(screen.queryByText("Proceso de selección")).not.toBeInTheDocument();
  });

  it("still renders the level/openings fields for a non-publisher", () => {
    render(<Wrapper codes={[]} />);
    expect(screen.getByText("Nivel del recurso y cantidad")).toBeInTheDocument();
  });

  it("renders the 'Proceso de selección' field for a publisher", () => {
    render(<Wrapper codes={[PERM.vacanciesPublish]} />);
    expect(screen.getByText("Proceso de selección")).toBeInTheDocument();
  });
});
