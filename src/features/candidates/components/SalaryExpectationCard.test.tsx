import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";

import { SalaryExpectationCard } from "./SalaryExpectationCard";

const APPLIED_AT = "2026-09-01T14:30:00-05:00";

interface Overrides {
  salaryExpectation?: number | null;
  appliedAt?: string;
}

/**
 * Defaults are spread, not coalesced: `?? 1200` would swallow an explicit
 * `null` and silently test the declared case instead of the undeclared one.
 */
function renderCard(overrides: Overrides = {}) {
  const props = { salaryExpectation: 1200 as number | null, appliedAt: APPLIED_AT, ...overrides };
  render(<SalaryExpectationCard {...props} />);
}

describe("SalaryExpectationCard — amount", () => {
  it("shows the declared amount as currency", () => {
    renderCard({ salaryExpectation: 1200 });
    // Locale output varies on the separator, so assert on the digits and symbol
    // rather than pinning an exact string.
    expect(screen.getByText(/\$\s?1[.,]200/)).toBeInTheDocument();
  });

  it("reports an undeclared amount as such, never as $0", () => {
    // Older applications predate the required-field change and really do carry
    // NULL. Showing "$0" would state the candidate asked for nothing.
    renderCard({ salaryExpectation: null });
    expect(screen.getByText("No declarado")).toBeInTheDocument();
    expect(screen.queryByText(/\$\s?0/)).not.toBeInTheDocument();
  });

  it("shows a declared zero, which is a real answer", () => {
    renderCard({ salaryExpectation: 0 });
    expect(screen.getByText(/\$\s?0/)).toBeInTheDocument();
    expect(screen.queryByText("No declarado")).not.toBeInTheDocument();
  });

  it("labels the figure so it is not mistaken for another amount on the profile", () => {
    renderCard();
    expect(screen.getByText("Aspiración salarial")).toBeInTheDocument();
  });
});

describe("SalaryExpectationCard — application date", () => {
  it("shows when the candidate applied, which is when the amount was declared", () => {
    // salary_expectation is set at creation and ApplicationUpdate cannot change
    // it, so this date really does belong next to the figure.
    renderCard({ appliedAt: APPLIED_AT });
    expect(screen.getByText("Postuló el")).toBeInTheDocument();
    expect(screen.getByText(/01 de septiembre de 2026/i)).toBeInTheDocument();
  });

  it("still renders the amount when the date is unusable", () => {
    // A malformed timestamp must not take the salary figure down with it.
    renderCard({ salaryExpectation: 1200, appliedAt: "not-a-date" });
    expect(screen.getByText(/\$\s?1[.,]200/)).toBeInTheDocument();
    expect(screen.queryByText("Postuló el")).not.toBeInTheDocument();
  });
});
