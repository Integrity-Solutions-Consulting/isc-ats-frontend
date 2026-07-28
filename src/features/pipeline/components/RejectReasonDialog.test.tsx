import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { RejectReasonDialog } from "./RejectReasonDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof RejectReasonDialog>> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <RejectReasonDialog
      open
      candidateName="Jane Doe"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onCancel, onConfirm };
}

describe("RejectReasonDialog", () => {
  it("does not render when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByText(/rechazar candidato/i)).not.toBeInTheDocument();
  });

  it("requires a non-empty reason — submitting empty shows a validation error and does not confirm", async () => {
    const { onConfirm } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /^rechazar$/i }));

    expect(await screen.findByText(/motivo del rechazo es obligatorio/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancel closes without confirming", () => {
    const { onCancel, onConfirm } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirm sends the trimmed reason", async () => {
    const { onConfirm } = renderDialog();

    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), {
      target: { value: "  No cumple el perfil técnico.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^rechazar$/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("No cumple el perfil técnico."));
  });

  it("shows a submitError message when the mutation fails", () => {
    renderDialog({ submitError: "No se pudo rechazar al candidato." });
    expect(screen.getByText("No se pudo rechazar al candidato.")).toBeInTheDocument();
  });

  it("disables cancel and confirm while submitting", () => {
    renderDialog({ isSubmitting: true });
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /rechazando/i })).toBeDisabled();
  });
});
