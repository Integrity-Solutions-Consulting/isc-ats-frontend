import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { PortalSidebar } from "./PortalSidebar";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderSidebar(codes: string[]) {
  return render(
    <PermissionsProvider codes={codes} loaded>
      <PortalSidebar />
    </PermissionsProvider>,
  );
}

describe("PortalSidebar — Suscriptores gating", () => {
  it("hides 'Suscriptores' when the user lacks auth.subscribers.read", () => {
    renderSidebar([]);
    expect(screen.queryByText("Suscriptores")).not.toBeInTheDocument();
  });

  it("shows 'Suscriptores' when the user holds auth.subscribers.read", () => {
    renderSidebar([PERM.subscribers]);
    expect(screen.getByText("Suscriptores")).toBeInTheDocument();
  });
});
