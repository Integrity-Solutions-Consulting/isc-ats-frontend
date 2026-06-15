import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Test title",
  };

  it("renders title and children", () => {
    render(
      <Modal {...baseProps}>
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByText("Test title")).toBeInTheDocument();
    expect(screen.getByText("Modal body content")).toBeInTheDocument();
  });

  it("renders with role='dialog'", () => {
    render(<Modal {...baseProps}>content</Modal>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has aria-labelledby pointing to the title", () => {
    render(<Modal {...baseProps}>content</Modal>);
    const dialog = screen.getByRole("dialog");
    const labelledById = dialog.getAttribute("aria-labelledby");
    expect(labelledById).toBeTruthy();
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl).toHaveTextContent("Test title");
  });

  it("has aria-describedby pointing to description when provided", () => {
    render(
      <Modal {...baseProps} description="A helpful description">
        content
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    const describedById = dialog.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    const descEl = document.getElementById(describedById!);
    expect(descEl).toHaveTextContent("A helpful description");
  });

  it("close button has aria-label 'Cerrar'", () => {
    render(<Modal {...baseProps}>content</Modal>);
    expect(
      screen.getByRole("button", { name: /cerrar/i })
    ).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Escape is pressed", async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal {...baseProps} onOpenChange={onOpenChange}>
        content
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies max-w-sm for size='sm'", () => {
    render(
      <Modal {...baseProps} size="sm">
        content
      </Modal>
    );
    const content = screen.getByRole("dialog");
    expect(content.className).toContain("max-w-sm");
  });

  it("applies max-w-2xl for size='lg'", () => {
    render(
      <Modal {...baseProps} size="lg">
        content
      </Modal>
    );
    const content = screen.getByRole("dialog");
    expect(content.className).toContain("max-w-2xl");
  });

  it("renders footer content inside DialogFooter when provided", () => {
    render(
      <Modal {...baseProps} footer={<button>Save</button>}>
        content
      </Modal>
    );
    const footerEl = document.querySelector("[data-slot='dialog-footer']");
    expect(footerEl).toBeTruthy();
    expect(footerEl).toContainElement(screen.getByRole("button", { name: "Save" }));
  });

  it("does not emit Radix 'Missing Description' warning when no description is provided", () => {
    // When aria-describedby={undefined} is passed explicitly, Radix suppresses
    // the warning. This test verifies no stderr warning is produced.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Modal {...baseProps}>content without description</Modal>);

    const radixWarning = [...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .some(
        (msg) =>
          typeof msg === "string" &&
          msg.includes("Missing") &&
          msg.includes("Description")
      );

    expect(radixWarning).toBe(false);

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("does not render DialogDescription when description prop is absent", () => {
    render(<Modal {...baseProps}>content</Modal>);
    expect(
      document.querySelector("[data-slot='dialog-description']")
    ).toBeNull();
  });
});
