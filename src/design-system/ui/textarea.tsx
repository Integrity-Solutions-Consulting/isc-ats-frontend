import * as React from "react";

import { cn } from "@/shared/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

function Textarea({ className, error, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors",
        "placeholder:text-ink-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-danger focus-visible:ring-danger/50 focus-visible:border-danger"
          : "focus-visible:border-primary-300",
        className,
      )}
      {...props}
    />
  );
}

Textarea.displayName = "Textarea";

export { Textarea };
