"use client";

import React from "react";
import { cn } from "@/shared/utils/index";

export interface TogglePillItem {
  value: string;
  label: string;
}

export interface TogglePillProps {
  items: TogglePillItem[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  className?: string;
}

/**
 * Single-select segmented pill control for filters / toggle groups.
 *
 * Visual style: active pill → bg-primary-600 text-white;
 * inactive → bg-surface-2 text-ink-muted hover:bg-primary-50 hover:text-primary-700.
 *
 * Accessibility:
 * - role="group" with aria-label on the container (NOT a tablist — these are
 *   filter toggles, not content-section tabs).
 * - Each option is a <button> with aria-pressed reflecting the active state.
 */
export function TogglePill({
  items,
  value,
  onValueChange,
  label,
  className,
}: TogglePillProps) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-2", className)}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isActive
                ? "bg-primary-600 text-white"
                : "bg-surface-2 text-ink-muted hover:bg-primary-50 hover:text-primary-700"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
