"use client";

import { useId } from "react";
import { Combobox, type ComboboxOption } from "@/design-system/molecules/Combobox";

export function CandidateFilter({ title, ariaLabel, value, onChange, options, className }: {
  title: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  className: string;
}) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">{title}</label>
      <Combobox
        id={id}
        aria-label={ariaLabel}
        valueKey="id"
        emptyValueShowsPlaceholder
        clearSearchOnOpen
        placeholder={`Seleccionar ${title.toLocaleLowerCase("es")}`}
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}
