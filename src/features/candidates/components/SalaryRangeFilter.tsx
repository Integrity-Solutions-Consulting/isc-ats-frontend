"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/design-system/ui/input";

export const salaryValue = (value?: string): number | null =>
  value?.trim() ? Number(value.replace(",", ".")) : null;

export function SalaryRangeFilter({ from = "", to = "", onChange }: {
  from?: string;
  to?: string;
  onChange: (range: { salaryFrom: string; salaryTo: string }) => void;
}) {
  const minimum = salaryValue(from);
  const maximum = salaryValue(to);
  const invalid = minimum !== null && maximum !== null && minimum > maximum;

  return (
    <fieldset aria-label="Aspiración salarial" className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {(["from", "to"] as const).map((bound) => {
          const value = bound === "from" ? from : to;
          const label = bound === "from" ? "Desde" : "Hasta";
          const update = (next: string) => onChange({
            salaryFrom: bound === "from" ? next : from,
            salaryTo: bound === "to" ? next : to,
          });
          const step = (direction: number) => {
            let next = Math.max(0, (salaryValue(value) ?? 0) + direction);
            if (bound === "from" && maximum !== null) next = Math.min(next, maximum);
            if (bound === "to" && minimum !== null) next = Math.max(next, minimum);
            update(String(Number(next.toFixed(2))));
          };
          return (
            <div key={bound} className="flex items-center gap-2">
              {bound === "to" && <span aria-hidden="true" className="text-ink-muted">-</span>}
              <div className="relative w-[140px]">
              <Input
                type="text"
                role="spinbutton"
                inputMode="decimal"
                aria-label={`Aspiración salarial ${label.toLowerCase()}`}
                aria-valuemin={bound === "to" ? minimum ?? 0 : 0}
                aria-valuemax={bound === "from" ? maximum ?? undefined : undefined}
                aria-valuenow={salaryValue(value) ?? undefined}
                aria-invalid={invalid}
                aria-describedby={invalid ? "salary-range-error" : undefined}
                placeholder={`${label} $`}
                value={value}
                className={`pr-7 ${invalid ? "border-danger" : ""}`}
                onChange={(event) => {
                  const next = event.target.value;
                  if (/^\d*(?:[.,]\d{0,2})?$/.test(next) && (next === "" || /\d/.test(next))) update(next);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault();
                    step(event.key === "ArrowUp" ? 1 : -1);
                  }
                }}
              />
              <div className="absolute inset-y-1 right-1 flex flex-col">
                {[1, -1].map((direction) => (
                  <button key={direction} type="button"
                    aria-label={`${direction === 1 ? "Aumentar" : "Disminuir"} aspiración salarial ${label.toLowerCase()}`}
                    className="rounded px-0.5 text-ink-muted hover:bg-surface-2 focus-visible:outline-primary-600"
                    onClick={() => step(direction)}>
                    {direction === 1 ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                ))}
              </div>
              </div>
            </div>
          );
        })}
      </div>
      {invalid && (
        <span id="salary-range-error" role="alert" className="text-xs text-danger">Desde no puede ser mayor que Hasta.</span>
      )}
    </fieldset>
  );
}
