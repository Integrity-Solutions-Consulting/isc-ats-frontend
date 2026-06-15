"use client";

import React from "react";
import { cn } from "@/shared/utils/index";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that binds a label to its control, injects ARIA error attributes,
 * and renders its own error message element.
 *
 * Accessibility contract:
 * - `<label htmlFor={htmlFor}>` links to the control.
 * - When required, an asterisk span with aria-hidden="true" is appended.
 * - When error is provided:
 *     • <p id="${htmlFor}-error" role="alert"> is rendered below the control.
 *     • Child control receives aria-invalid="true" + aria-describedby="${htmlFor}-error"
 *       IF children is a valid single React element (React.isValidElement guard).
 *       If children is not a single element (e.g. string, Fragment, array),
 *       it is rendered as-is without injection to avoid a runtime crash.
 */
export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;

  const child =
    error && React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
          {
            "aria-invalid": true as boolean | "true" | "false" | "grammar" | "spelling",
            "aria-describedby": errorId,
          }
        )
      : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-ink"
      >
        {label}
        {required && (
          <span
            aria-hidden="true"
            className="ml-0.5 text-danger"
          >
            *
          </span>
        )}
      </label>

      {child}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
