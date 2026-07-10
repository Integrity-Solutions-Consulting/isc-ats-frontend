import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { NotesCard } from "./NotesCard";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";

vi.mock("@/features/candidates/api/candidatesApi", () => ({
  getCandidateNotes: vi.fn().mockResolvedValue([]),
  addNote: vi.fn().mockResolvedValue({}),
}));

function renderNotes(codes: string[], readOnly = false) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider codes={codes} loaded>
        <NotesCard applicationId="app-1" readOnly={readOnly} />
      </PermissionsProvider>
    </QueryClientProvider>,
  );
}

describe("NotesCard — comment gating", () => {
  it("does not render the add-note form without applicationNotesCreate", () => {
    renderNotes([]);
    expect(screen.queryByPlaceholderText(/agregar una nota/i)).not.toBeInTheDocument();
  });

  it("renders the add-note form with applicationNotesCreate", () => {
    renderNotes([PERM.applicationNotesCreate]);
    expect(screen.getByPlaceholderText(/agregar una nota/i)).toBeInTheDocument();
  });

  it("stays hidden when readOnly even if the permission is present", () => {
    renderNotes([PERM.applicationNotesCreate], true);
    expect(screen.queryByPlaceholderText(/agregar una nota/i)).not.toBeInTheDocument();
  });
});
