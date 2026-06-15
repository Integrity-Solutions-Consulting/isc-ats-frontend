import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const cardVariants = cva(
  "border",
  {
    variants: {
      variant: {
        default: "bg-surface border-border rounded-lg shadow-sm",
        // No shadow-sm: portal cards sit on tinted/elevated surfaces — shadow intentionally omitted.
        portal: "bg-surface border-primary-200 rounded-xl",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function Card({ className, variant, padding, asChild = false, ref, ...props }: CardProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

Card.displayName = "Card";

export { Card, cardVariants };
