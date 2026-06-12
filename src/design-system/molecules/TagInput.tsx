"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/shared/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

/** Chip-style multi-value input. Enter or comma adds; Backspace removes last. */
export function TagInput({
  value,
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [draft, setDraft] = React.useState("");

  function addTag() {
    const tag = draft.trim();
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface p-2 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Quitar ${tag}`}
            className="text-primary-700/60 transition-colors hover:text-primary-700"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            removeTag(value[value.length - 1]);
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        className="min-w-[140px] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
      />
    </div>
  );
}
