import { Badge } from "@/design-system/ui/badge";
import type { BadgeProps } from "@/design-system/ui/badge";
import { cn } from "@/shared/utils";

export interface MatchBadgeProps {
  score: number | null;
}

function resolveVariant(score: number | null): BadgeProps["variant"] {
  if (score === null) return "neutral";
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

/**
 * Match score badge composing ui/Badge.
 * Thresholds: >=75 success, >=50 warning, <50 danger, null → neutral "Analizando".
 * The /15 opacity for background colors comes from badge.tsx variant definitions.
 *
 * Analizando state overrides: no border (border-transparent) + text-ink-subtle
 * to match the original inline badge in CandidateCard (pre-MatchBadge extraction).
 */
export function MatchBadge({ score }: MatchBadgeProps) {
  const variant = resolveVariant(score);
  const label = score === null ? "Analizando" : `${score}% match`;

  return (
    <Badge
      variant={variant}
      className={cn(score === null && "border-transparent text-ink-subtle")}
    >
      {label}
    </Badge>
  );
}
