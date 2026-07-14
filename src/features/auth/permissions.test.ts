import { describe, it, expect } from "vitest";

import { PERM } from "./permissions";

describe("PERM", () => {
  it("defines the vacancy action codes required for solicitud/publish gating", () => {
    expect(PERM.vacanciesPublish).toBe("recruitment.vacancies.publish");
    expect(PERM.vacanciesUpdate).toBe("recruitment.vacancies.update");
    expect(PERM.vacanciesDelete).toBe("recruitment.vacancies.delete");
  });

  it("defines the application action codes required for Kanban gating", () => {
    expect(PERM.applicationsCreate).toBe("recruitment.applications.create");
    expect(PERM.applicationsUpdate).toBe("recruitment.applications.update");
    expect(PERM.applicationsDelete).toBe("recruitment.applications.delete");
  });

  it("defines the application-notes create code", () => {
    expect(PERM.applicationNotesCreate).toBe("recruitment.application_notes.create");
  });

  it("defines the interviews create code", () => {
    expect(PERM.interviewsCreate).toBe("recruitment.interviews.create");
  });

  it("defines the files read code", () => {
    expect(PERM.filesRead).toBe("storage.files.read");
  });

  it("does not collide with the existing view-level codes", () => {
    expect(PERM.vacancies).toBe("recruitment.vacancies.read");
  });
});
