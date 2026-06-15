"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/design-system/ui/dialog";
import { cn } from "@/shared/utils/index";

type ModalSize = "sm" | "md" | "lg";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showClose?: boolean;
}

/**
 * Thin façade over ui/dialog.
 * Handles size, optional description, and optional footer slot.
 * Focuses only on composition — overlay, focus-trap, and animation
 * come from DialogContent.
 *
 * When description is absent, we pass aria-describedby={undefined} explicitly to
 * DialogContent so Radix treats it as an intentional opt-out and suppresses the
 * "Missing Description" a11y warning. When description is provided, Radix wires
 * aria-describedby to the DialogDescription automatically.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  showClose = true,
}: ModalProps) {
  // Explicit opt-out: when no description is supplied, pass aria-describedby={undefined}
  // so Radix suppresses its "Missing Description" warning.
  const descriptionProps = description
    ? {}
    : { "aria-describedby": undefined as string | undefined };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showClose}
        className={cn(sizeClass[size])}
        {...descriptionProps}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
