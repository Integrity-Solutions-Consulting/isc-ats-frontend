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
  city: "Quito",
  educationLevel: "Universitario",
  degree: "Ingeniería",
  currentlyStudying: false,
  currentlyEmployed: false,
  currentEmployer: null,
  cv: {
    fileId: "file-1",
    fileName: "cv.pdf",
    uploadedAt: "2026-01-01T00:00:00Z",
    pageCount: 2,
    fileSizeKB: 100,
    url: "/api/candidate/cv/file-1",
  },
};

describe("PersonalDataCard — CV download stays ungated", () => {
  it("renders 'Ver' and 'Descargar' with no permissions at all (fail-open by design)", () => {
    render(
      <PermissionsProvider codes={[]} loaded>
        <PersonalDataCard candidate={candidate} />
      </PermissionsProvider>,
    );
    expect(screen.getByRole("button", { name: /ver/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /descargar/i })).toBeInTheDocument();
  });
});
