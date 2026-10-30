"use client";

import { useState, type MouseEvent } from "react";
import { Download, Eye } from "lucide-react";

import { Button } from "@/design-system/ui/button";
import { cn } from "@/shared/utils";

interface CandidateCvActionsProps {
  /** Storage file id of the CV. */
  fileId: string | number;
  /**
   * Icon-only buttons for dense surfaces such as table rows. The default keeps
   * the labelled "Ver" / "Descargar" pair used in the candidate profile.
   */
  compact?: boolean;
  /** Optional candidate name, appended to the accessible label. */
  subject?: string;
  className?: string;
}

/**
 * View / download actions for a candidate's CV.
 *
 * Both surfaces (profile card and directory table) share this component so the
 * `?view=1` preview and the download URL stay in sync.
 */
export function CandidateCvActions({
  fileId,
  compact = false,
  subject,
  className,
}: CandidateCvActionsProps) {
  const url = `/api/candidate/cv/${fileId}`;
  const subjectSuffix = subject ? ` de ${subject}` : "";
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = (event: MouseEvent) => {
    // Table rows navigate on click; the action must not trigger that.
    event.stopPropagation();
    window.open(`${url}?view=1`, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        throw new Error(
          body?.error ?? body?.detail ?? "No se pudo descargar la hoja de vida.",
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        throw new Error("El servidor devolvió un error en lugar del PDF.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^";]+)"?/)?.[1] ?? "hoja-de-vida.pdf";
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo descargar la hoja de vida.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-ink-muted hover:text-primary-700"
          title="Ver hoja de vida"
          aria-label={`Ver hoja de vida${subjectSuffix}`}
          onClick={handleView}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-ink-muted hover:text-primary-700"
          title="Descargar hoja de vida"
          aria-label={`Descargar hoja de vida${subjectSuffix}`}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 gap-2", className)}>
      <Button variant="ghost" size="sm" onClick={handleView}>
        Ver
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className="h-4 w-4" />
        Descargar
      </Button>
    </div>
  );
}
