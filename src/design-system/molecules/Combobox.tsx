"use client";

import { useState, useRef, useEffect, useId } from "react";
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
  /**
   * What `value`/`onChange` carry:
   * - "label" (default): free-text combobox. `value` is the typed text and
   *   `onChange` emits whatever the user types or selects (the option label).
   *   Use for open fields like a job title.
   * - "id": strict searchable select. `value` is the selected option id and
   *   `onChange` emits the option id. The input shows the matching label and
   *   typing only filters — it never becomes the value. Use for FK fields.
   */
  valueKey?: "label" | "id";
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
  valueKey = "label",
}: ComboboxProps) {
  const isIdMode = valueKey === "id";

  // The text shown in the input for the current value. In id mode it is the
  // label of the selected option; in label mode the value is itself the text.
  const selectedLabel = isIdMode
    ? options.find((o) => o.id === value)?.label ?? ""
    : value;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedLabel);
  // getDerivedState pattern: setState during render → React re-renders synchronously.
  // Sync the visible text when the selected label changes. Keying on the label
  // (not the raw value) also handles id mode where options load asynchronously
  // after the value is set (e.g. the edit form resolves the label once catalogs
  // arrive). While typing in id mode the label is unchanged, so it never clobbers.
  const [prevSelectedLabel, setPrevSelectedLabel] = useState(selectedLabel);
  if (selectedLabel !== prevSelectedLabel) {
    setPrevSelectedLabel(selectedLabel);
    setQuery(selectedLabel);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  // Latest selected label, read inside the outside-click handler to restore the
  // input when the user clicks away after typing a non-matching query (id mode).
  const selectedLabelRef = useRef(selectedLabel);
  useEffect(() => {
    selectedLabelRef.current = selectedLabel;
  }, [selectedLabel]);

  const generatedId = useId();
  const listboxId = id ? `${id}-listbox` : `${generatedId}-listbox`;

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (isIdMode) setQuery(selectedLabelRef.current);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isIdMode]);

  const filtered =
    query.length === 0
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
    >
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          // In id mode, typing only filters — free text is never a valid value.
          if (!isIdMode) onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            if (isIdMode) setQuery(selectedLabel);
          }
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
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((option) => {
              const selected = isIdMode ? value === option.id : value === option.label;
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(isIdMode ? option.id : option.label);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm text-ink hover:bg-surface-2",
                    selected && "bg-primary-50 font-medium text-primary-700",
                  )}
                >
                  {option.label}
                </li>
              );
            })
          ) : (
            <li
              role="option"
              aria-disabled="true"
              aria-selected={false}
              className="px-3 py-2 text-sm text-ink-muted"
            >
              Sin resultados
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
