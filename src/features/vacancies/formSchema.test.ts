import { describe, it, expect } from "vitest";

import { makeVacancySchema, EMPTY_VACANCY_FORM } from "./formSchema";

const base = {
  ...EMPTY_VACANCY_FORM,
  position: "Dev",
  clientCompany: "1",
  contact: "1",
  department: "1",
  city: "1",
  workMode: "onsite",
  career: "1",
  level: "junior",
  openings: 1,
  experienceYears: 2,
  workSchedule: "08:00 - 17:00",
  isIndefiniteDuration: true,
  description: "Descripción del cargo",
};

describe("makeVacancySchema", () => {
  it("requires process when requireProcess is true (publisher)", () => {
    const schema = makeVacancySchema(true);
    const result = schema.safeParse({ ...base, process: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a filled process when requireProcess is true (publisher)", () => {
    const schema = makeVacancySchema(true);
    const result = schema.safeParse({ ...base, process: "1" });
    expect(result.success).toBe(true);
  });

  it("does not require process when requireProcess is false (non-publisher/solicitud)", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({ ...base, process: "" });
    expect(result.success).toBe(true);
  });

  it("still requires position regardless of requireProcess", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({ ...base, position: "", process: "" });
    expect(result.success).toBe(false);
  });

  it("requires experienceYears — a null (unfilled) value must not silently become 0", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({ ...base, experienceYears: null });
    expect(result.success).toBe(false);
  });

  it("requires workSchedule to be filled in", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({ ...base, workSchedule: "" });
    expect(result.success).toBe(false);
  });

  it("requires a duration unless isIndefiniteDuration is checked", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({
      ...base,
      isIndefiniteDuration: false,
      durationYears: null,
      durationMonths: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a blank duration when isIndefiniteDuration is checked", () => {
    const schema = makeVacancySchema(false);
    const result = schema.safeParse({
      ...base,
      isIndefiniteDuration: true,
      durationYears: null,
      durationMonths: null,
    });
    expect(result.success).toBe(true);
  });
});
