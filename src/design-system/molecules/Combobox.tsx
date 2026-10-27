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
  inputClassName?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
  valueKey?: "label" | "id";
  /** En modo id, muestra el placeholder cuando el valor es vacío. */
  emptyValueShowsPlaceholder?: boolean;
  /** En modo id, limpia la búsqueda al abrir sin cambiar la selección. */
  clearSearchOnOpen?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  id,
  className,
  inputClassName,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  disabled,
  valueKey = "label",
  emptyValueShowsPlaceholder = false,
  clearSearchOnOpen = false,
}: ComboboxProps) {
  const isIdMode = valueKey === "id";
  const labelForOption = (option: ComboboxOption) =>
    isIdMode && emptyValueShowsPlaceholder && option.id === ""
      ? ""
      : option.label;
  const selectedLabel = isIdMode
    ? emptyValueShowsPlaceholder && value === ""
      ? ""
      : (options.find((option) => option.id === value)?.label ?? "")
    : value;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedLabel);
  const [prevSelectedLabel, setPrevSelectedLabel] = useState(selectedLabel);
  if (selectedLabel !== prevSelectedLabel) {
    setPrevSelectedLabel(selectedLabel);
    setQuery(selectedLabel);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const justFocusedRef = useRef(false);
  const selectedLabelRef = useRef(selectedLabel);
  useEffect(() => {
    selectedLabelRef.current = selectedLabel;
  }, [selectedLabel]);

  const generatedId = useId();
  const listboxId = id ? `${id}-listbox` : `${generatedId}-listbox`;

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        justFocusedRef.current = false;
        if (isIdMode) setQuery(selectedLabelRef.current);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isIdMode]);

  const filtered =
    query.length === 0 || query === selectedLabel
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase()),
        );

  const openList = () => {
    if (isIdMode && clearSearchOnOpen) setQuery("");
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    justFocusedRef.current = false;
    if (isIdMode) setQuery(selectedLabel);
  };

  const selectOption = (option: ComboboxOption) => {
    onChange(isIdMode ? option.id : option.label);
    setQuery(labelForOption(option));
    setOpen(false);
    justFocusedRef.current = false;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={open && isIdMode && clearSearchOnOpen ? "" : placeholder}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        onChange={(event) => {
          setQuery(event.target.value);
          if (!isIdMode) onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          openList();
          justFocusedRef.current = true;
        }}
        onClick={() => {
          if (justFocusedRef.current) {
            justFocusedRef.current = false;
          } else if (open) {
            closeList();
          } else {
            openList();
          }
        }}
        onBlur={() => {
          // Una selección con el ratón evita el blur mediante preventDefault.
          setOpen(false);
          justFocusedRef.current = false;
          if (isIdMode) setQuery(selectedLabelRef.current);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeList();
          } else if (event.key === "Enter") {
            if (open && filtered.length > 0) {
              event.preventDefault();
              selectOption(filtered[0]);
            } else {
              closeList();
            }
          }
        }}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-surface px-3 py-1 pr-9 text-sm text-ink shadow-sm outline-none transition-colors",
          "placeholder:text-ink-subtle",
          "focus-visible:border-primary-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid && "border-danger",
          inputClassName,
        )}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((option) => {
              const selected = isIdMode
                ? value === option.id
                : value === option.label;
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option);
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
