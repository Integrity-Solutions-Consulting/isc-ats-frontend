"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/design-system/ui/button";
import { Avatar } from "@/design-system/atoms/Avatar";
import { ConfirmDialog } from "@/design-system/molecules/ConfirmDialog";
import { cn } from "@/shared/utils";
import { ROUTES } from "@/shared/constants/routes";
import { useCandidateDirectoryNavStore } from "@/shared/stores/candidateDirectoryNavStore";
import { useAddToTalentPool } from "@/features/candidates/hooks/useCandidates";
import { useRemoveFromTalentPool } from "@/features/talent-pool/hooks/useTalentPool";
import type { Candidate } from "@/features/candidates/types";

interface CandidateDirectoryHeaderProps {
  candidate: Candidate;
  pos: number;
  total: number;
  talentPoolId?: string | null;
  vacancyId?: string | null;
}

export function CandidateDirectoryHeader({
  candidate,
  pos,
  total,
  talentPoolId: initialTalentPoolId,
  vacancyId,
}: CandidateDirectoryHeaderProps) {
  const router = useRouter();
  const removeMutation = useRemoveFromTalentPool();
  const addMutation = useAddToTalentPool();

  const [activeTpId, setActiveTpId] = useState<string | null>(
    initialTalentPoolId ?? null,
  );
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const entries = useCandidateDirectoryNavStore((s) => s.entries);

  function buildNavUrl(targetPos: number): string | null {
    const entry = entries[targetPos - 1];
    if (!entry) return null;
    return ROUTES.candidatoDetalle(entry.candidateId, {
      pos: targetPos,
      total,
      vacancyId: vacancyId ?? undefined,
      tpId: entry.tpId ?? undefined,
    });
  }

  const prevUrl = pos > 1 ? buildNavUrl(pos - 1) : null;
  const nextUrl = pos < total ? buildNavUrl(pos + 1) : null;

  const handleAdd = () => {
    addMutation.mutate(
      { candidateId: candidate.id, vacancyId: vacancyId ?? null },
      {
        onSuccess: () => {
          setActiveTpId("in-pool");
          router.refresh();
        },
      },
    );
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Back arrow */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Volver a Candidatos"
        >
          <Link href={ROUTES.candidatos}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            size="lg"
            initials={candidate.initials}
            src={
              candidate.avatarFileId
                ? `/api/candidate/cv/${candidate.avatarFileId}?view=1`
                : undefined
            }
            className={cn("text-white", candidate.avatarColor)}
          />
          <div>
            <p className="text-xl font-bold text-ink">{candidate.fullName}</p>
          </div>
        </div>

        {/* Talent pool action */}
        {activeTpId ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto text-danger hover:bg-danger/10 hover:text-danger"
            disabled={removeMutation.isPending}
            onClick={() => setConfirmRemoveOpen(true)}
          >
            Quitar del banco de talento
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1 text-primary-700 border-primary-200 hover:bg-primary-50 hover:text-primary-800"
            disabled={addMutation.isPending}
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            {addMutation.isPending
              ? "Agregando…"
              : "Agregar al banco de talento"}
          </Button>
        )}

        {/* Position navigator */}
        {total > 1 && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            {prevUrl ? (
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Candidato anterior"
                className="h-7 w-7"
              >
                <Link href={prevUrl}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Candidato anterior"
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <span>
              candidato {pos} de {total}
            </span>
            {nextUrl ? (
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Candidato siguiente"
                className="h-7 w-7"
              >
                <Link href={nextUrl}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Candidato siguiente"
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {activeTpId && (
        <ConfirmDialog
          open={confirmRemoveOpen}
          onOpenChange={setConfirmRemoveOpen}
          title="¿Quitar del banco de talento?"
          description="Este candidato será removido del banco de talento. Podrás volver a agregarlo en cualquier momento."
          confirmLabel="Quitar"
          variant="danger"
          onConfirm={() => {
            if (activeTpId !== "in-pool") {
              removeMutation.mutate(activeTpId, {
                onSuccess: () => {
                  setActiveTpId(null);
                  router.refresh();
                },
              });
            } else {
              setActiveTpId(null);
              router.refresh();
            }
          }}
        />
      )}
    </>
  );
}
