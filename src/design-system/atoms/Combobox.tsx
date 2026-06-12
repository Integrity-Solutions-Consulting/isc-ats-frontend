"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";

export interface ComboboxOption {
  id: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  id,
  className,
  "aria-invalid": ariaInvalid,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const filtered =
    query.length === 0
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-autocomplete="list"
        aria-expanded={open}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-surface px-3 py-1 pr-8 text-sm text-ink shadow-sm outline-none transition-colors",
          "placeholder:text-ink-subtle",
          "focus-visible:border-primary-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid && "border-danger focus-visible:ring-danger/50",
        )}
      />
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.map((option) => (
            <li
              key={option.id}
              role="option"
              aria-selected={value === option.label}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(option.label);
                setQuery(option.label);
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-ink hover:bg-surface-2",
                value === option.label && "bg-primary-50 font-medium text-primary-700",
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
