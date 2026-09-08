import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";

import { PersonalDataCard } from "./PersonalDataCard";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import type { Candidate } from "../types";

const candidate: Candidate = {
  id: "cand-1",
  fullName: "Jane Doe",
  initials: "JD",
  avatarColor: "bg-primary-600",
  nationalId: "1234567890",
  dateOfBirth: "1995-01-01",
  email: "jane@example.com",
  phone: "0999999999",
  docType: "cedula",
  city: "Quito",
  homeAddress: "Av. Amazonas N34-100",
  educationLevel: "Universitario",
  career: "Ingeniería en Sistemas",
  title: "Ingeniero",
  university: "ESPOL",
  currentlyStudying: false,
  currentlyEmployed: false,
  currentEmployer: null,
  yearsOfExperience: 3,
  cv: {
    fileId: "file-1",
    fileName: "cv.pdf",
    uploadedAt: "2026-01-01T00:00:00Z",
    pageCount: 2,
    fileSizeKB: 100,
    url: "/api/candidate/cv/file-1",
  },
};

function renderCard(overrides: Partial<Candidate> = {}) {
  render(
    <PermissionsProvider codes={[]} loaded>
      <PersonalDataCard candidate={{ ...candidate, ...overrides }} />
    </PermissionsProvider>,
  );
}

describe("PersonalDataCard — CV download stays ungated", () => {
  it("renders 'Ver' and 'Descargar' with no permissions at all (fail-open by design)", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /ver/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /descargar/i })).toBeInTheDocument();
  });
});

describe("PersonalDataCard — carrera vs título", () => {
  it("shows the career and the awarded title as separate, correctly labelled fields", () => {
    // The card used to render the CAREER under the "Título" label, so recruiters
    // read one answer believing it was the other, and the real title was never
    // shown at all.
    renderCard({ career: "Ingeniería en Sistemas", title: "Ingeniero" });

    const career = screen.getByText("Carrera").parentElement;
    const title = screen.getByText("Título").parentElement;

    expect(career).toHaveTextContent("Ingeniería en Sistemas");
    expect(title).toHaveTextContent("Ingeniero");
  });

  it("shows the university, which the board can also be filtered by", () => {
    renderCard({ university: "Universidad de Cuenca" });
    expect(screen.getByText("Universidad de Cuenca")).toBeInTheDocument();
  });
});

describe("PersonalDataCard — identity document", () => {
  it("labels the number as a cédula by default", () => {
    renderCard({ docType: "cedula", nationalId: "1234567890" });
    expect(screen.getByText("Cédula")).toBeInTheDocument();
    expect(screen.queryByText("Pasaporte")).not.toBeInTheDocument();
  });

  it("labels a foreign applicant's number as a passport", () => {
    // The candidate's own profile already reads it this way. Hardcoding "Cédula"
    // made the two screens contradict each other about the same record.
    renderCard({ docType: "passport", nationalId: "AB1234567" });
    expect(screen.getByText("Pasaporte")).toBeInTheDocument();
    expect(screen.queryByText("Cédula")).not.toBeInTheDocument();
  });
});

describe("PersonalDataCard — blank fields", () => {
  it("says a missing optional field is unrecorded instead of leaving it blank", () => {
    // Most of these are optional during onboarding. An empty line under a label
    // reads as a broken screen rather than as an unanswered question.
    renderCard({ homeAddress: "", university: "" });
    expect(screen.getAllByText("No registrado").length).toBeGreaterThanOrEqual(2);
  });
});

describe("PersonalDataCard — años de experiencia", () => {
  it("shows the declared experience, which the board can be filtered by", () => {
    renderCard({ yearsOfExperience: 3 });
    expect(screen.getByText("3 años")).toBeInTheDocument();
  });

  it("keeps the half year rather than rounding it away", () => {
    renderCard({ yearsOfExperience: 1.5 });
    expect(screen.getByText("1.5 años")).toBeInTheDocument();
  });

  it("says 'año' in the singular for exactly one", () => {
    renderCard({ yearsOfExperience: 1 });
    expect(screen.getByText("1 año")).toBeInTheDocument();
  });

  it("reports undeclared experience as such, never as zero years", () => {
    // "0 años" would state the candidate has no experience, which is a claim
    // nobody made. Unknown and none are different answers.
    renderCard({ yearsOfExperience: null });
    expect(screen.getByText("No declarado")).toBeInTheDocument();
    expect(screen.queryByText("0 años")).not.toBeInTheDocument();
  });

  it("shows a declared zero as zero, which is a real answer", () => {
    renderCard({ yearsOfExperience: 0 });
    expect(screen.getByText("0 años")).toBeInTheDocument();
  });
});
