import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";

import { FormField } from "./FormField";

// Custom component that forwards unknown props to a native input.
// Proves the injection contract works beyond native <input>.
function CustomInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input data-testid="custom-input" {...props} />;
}

describe("FormField", () => {
  it("renders a <label> with the correct htmlFor", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    const label = screen.getByText("Email");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "email");
  });

  it("shows an asterisk with aria-hidden='true' and text-danger class when required", () => {
    render(
      <FormField label="Email" htmlFor="email" required>
        <input id="email" type="email" />
      </FormField>
    );
    const asterisk = document.querySelector("[aria-hidden='true']");
    expect(asterisk).toBeInTheDocument();
    expect(asterisk?.textContent).toContain("*");
    expect(asterisk?.className).toContain("text-danger");
  });

  it("does NOT render an asterisk when not required", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    expect(document.querySelector("[aria-hidden='true']")).toBeNull();
  });

  it("renders error element with id, role='alert', and error message when error is provided", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email">
        <input id="email" type="email" />
      </FormField>
    );
    const errorEl = document.getElementById("email-error");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveAttribute("role", "alert");
    expect(errorEl).toHaveTextContent("Invalid email");
  });

  it("child input gets aria-invalid='true' when error is provided", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email">
        <input id="email" type="email" />
      </FormField>
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("child input gets aria-describedby pointing to the error element when error is provided", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email">
        <input id="email" type="email" />
      </FormField>
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("does NOT render error element when no error", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    expect(document.getElementById("email-error")).toBeNull();
  });

  it("child has no aria-invalid and no aria-describedby when no error", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("custom component child receives injected aria-invalid and aria-describedby when error is provided", () => {
    render(
      <FormField label="Name" htmlFor="name" error="Required">
        <CustomInput id="name" />
      </FormField>
    );
    const input = screen.getByTestId("custom-input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "name-error");
  });

  it("does not crash when children is not a valid element (string) and error is provided", () => {
    // Non-element children must render without crashing; no injection occurs.
    expect(() =>
      render(
        <FormField label="Info" htmlFor="info" error="Something wrong">
          {"just a string"}
        </FormField>
      )
    ).not.toThrow();
    // Error message still appears
    expect(document.getElementById("info-error")).toBeInTheDocument();
  });
});
