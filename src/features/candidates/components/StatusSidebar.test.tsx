import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StatusSidebar } from "./StatusSidebar";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import type { CandidateApplication, OtherApplication } from "../types";
import type { PipelineStage } from "@/features/pipeline/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/candidates/hooks/useCandidates", () => ({
  useUpdateStageStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useMoveToNextStage: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCandidate: () => ({ mutate: vi.fn(), isPending: false }),
  useAddToTalentPool: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

vi.mock("@/features/talent-pool/api/talentPoolApi", () => ({
  getTalentPoolMembership: vi.fn().mockResolvedValue({ inPool: false, entryId: null }),
}));

vi.mock("@/features/interviews/components/AgendarEntrevistaModal", () => ({
  AgendarEntrevistaModal: () => null,
}));

global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as unknown as typeof fetch;

const application: CandidateApplication = {
  id: "app-1",
  candidateId: "cand-1",
  vacancyId: "vac-1",
  stageId: "stage-1",
  stageStatus: "pending_review",
  currentStatusId: null,
  matchPercent: 80,
  matchStatus: "done",
  salaryExpectation: 1200,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const stages: PipelineStage[] = [
  { id: "stage-1", vacancyId: "vac-1", name: "Por revisar", order: 1, type: "normal" },
  { id: "stage-2", vacancyId: "vac-1", name: "Entrevista", order: 2, type: "normal" },
];

const otherApplications: OtherApplication[] = [];

function renderSidebar(codes: string[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider codes={codes} loaded>
        <StatusSidebar
          application={application}
          stages={stages}
          otherApplications={otherApplications}
          vacancyId="vac-1"
          candidateName="Jane Doe"
          candidateInitials="JD"
          candidateAvatarColor="bg-primary-600"
          position="Dev"
        />
      </PermissionsProvider>
    </QueryClientProvider>,
  );
}

describe("StatusSidebar — move gating", () => {
  it("hides 'Mover a siguiente etapa' and 'Rechazar candidato' without applicationsUpdate", () => {
    renderSidebar([]);
    expect(screen.queryByRole("button", { name: /mover a siguiente etapa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rechazar candidato/i })).not.toBeInTheDocument();
  });

  it("shows 'Mover a siguiente etapa' and 'Rechazar candidato' with applicationsUpdate", () => {
    renderSidebar([PERM.applicationsUpdate]);
    expect(screen.getByRole("button", { name: /mover a siguiente etapa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechazar candidato/i })).toBeInTheDocument();
  });

  it("still shows unrelated actions (Agendar entrevista) without applicationsUpdate", () => {
    renderSidebar([]);
    expect(screen.getByRole("button", { name: /agendar entrevista/i })).toBeInTheDocument();
  });
});
