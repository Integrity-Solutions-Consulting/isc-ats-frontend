"use client";

import { Search } from "lucide-react";

import { Input } from "@/design-system/ui/input";
import { cn } from "@/shared/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchSlotProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Min width in Tailwind class form. Defaults to "min-w-[220px]". */
  className?: string;
}

interface FilterBarProps {
  /** Optional search slot config. Omit to render a bar with selects only. */
  search?: SearchSlotProps;
  /** Select filters and any additional controls. */
  children?: React.ReactNode;
  className?: string;
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

/**
 * Shared filter-bar shell used across all list pages.
 *
 * Renders the consistent container (`rounded-lg border border-border bg-surface-2 p-3`)
 * with an optional search `<Input>` atom on the left and any number of `<Select>`
 * atoms passed as children on the right. The container uses `bg-surface-2` so it
 * reads as a distinct zone from the white `bg-surface` inputs inside it.
 *
 * Usage:
 * ```tsx
 * <FilterBar search={{ value, onChange, placeholder: "Buscar…" }}>
 *   <Select value={status} onChange={…}>…</Select>
 * </FilterBar>
 * ```
 *
 * The component lives in design-system/molecules and receives everything via
 * props — no feature imports, no fetching.
 */
export function FilterBar({ search, children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 p-3",
        className,
      )}
    >
      {search && (
        <div
          className={cn(
            "relative min-w-[220px] flex-1",
            search.className,
          )}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            className="pl-9"
          />
        </div>
      )}
      {children}
    </div>
  );
}
