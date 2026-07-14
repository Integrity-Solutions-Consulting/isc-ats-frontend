import { describe, it, expect } from "vitest";

import { STATUS_LABEL, STATUS_BADGE_VARIANT } from "./labels";

describe("vacancy status labels", () => {
  it("has a 'solicitud' status label (draft no longer exists)", () => {
    expect(STATUS_LABEL.solicitud).toBe("Solicitud");
    expect((STATUS_LABEL as Record<string, string>).draft).toBeUndefined();
  });

  it("has a badge variant for 'solicitud'", () => {
    expect(STATUS_BADGE_VARIANT.solicitud).toBe("neutral");
    expect((STATUS_BADGE_VARIANT as Record<string, string>).draft).toBeUndefined();
  });

  it("still labels the other statuses", () => {
    expect(STATUS_LABEL.active).toBe("Publicada");
    expect(STATUS_LABEL.closed).toBe("Cerrada");
    expect(STATUS_LABEL.cancelled).toBe("Cancelada");
  });
});
