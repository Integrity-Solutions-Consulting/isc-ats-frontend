"use client";

import { Button } from "@/design-system/ui/button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' renders the confirm button as destructive. */
  variant?: "danger" | "default";
  onConfirm: () => void;
}

/**
 * Accessible confirmation dialog built on Modal (which facades ui/dialog).
 * Replace every `window.confirm` call with this two-step pattern:
 *   1. User triggers an action → set `open = true` and store pending context.
 *   2. User clicks Confirm → call `onConfirm` which runs the actual action.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      showClose={false}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
