import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const spinnerVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

function Spinner({ size, label = "Cargando", className, ...props }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex", className)} {...props}>
      <Loader2 aria-hidden className={cn(spinnerVariants({ size }))} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

Spinner.displayName = "Spinner";

export { Spinner };
