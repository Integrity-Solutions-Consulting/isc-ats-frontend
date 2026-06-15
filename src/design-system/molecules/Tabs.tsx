"use client";

import React, { useRef } from "react";
import { cn } from "@/shared/utils/index";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * WAI-ARIA compliant tab bar — underline style for content-section tabs.
 *
 * Keyboard navigation:
 * - ArrowLeft / ArrowRight: move focus between tabs (roving tabindex).
 * - Enter / Space: select the focused tab.
 *
 * ARIA:
 * - role="tablist" on the container.
 * - role="tab", aria-selected, id="tab-{value}", aria-controls="panel-{value}" on each button.
 * - Only the selected or currently focused tab is in the tab order (tabindex=0);
 *   all others use tabindex=-1 (roving tabindex pattern).
 *
 * Consumer contract:
 * - Pair each tab panel with: role="tabpanel" id="panel-{value}" aria-labelledby="tab-{value}"
 */
export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const direction = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + items.length) % items.length;
      tabRefs.current[nextIndex]?.focus();
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onValueChange(items[index].value);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Navegación de pestañas"
      className={cn("flex gap-0", className)}
    >
      {items.map((item, index) => {
        const isSelected = item.value === value;
        return (
          <button
            key={item.value}
            id={`tab-${item.value}`}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`panel-${item.value}`}
            tabIndex={isSelected ? 0 : -1}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "text-primary-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
