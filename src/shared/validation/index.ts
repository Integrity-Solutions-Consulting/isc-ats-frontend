/**
 * Shared form-validation primitives.
 *
 * Single source of truth for cross-cutting field rules (email format, required
 * text, length caps) so every form — RHF or manual — validates the same way.
 */

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** True when `value` (trimmed) is a syntactically valid email. */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Validate a required free-text field. Returns an error message or `undefined`.
 * Trims before checking so whitespace-only input is rejected.
 */
export function validateRequiredText(
  value: string,
  label: string,
  max = 120,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} es requerido.`;
  if (trimmed.length > max) return `Máximo ${max} caracteres.`;
  return undefined;
}

/** Validate a required email field. Returns an error message or `undefined`. */
export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "El correo es requerido.";
  if (!isValidEmail(value)) return "Correo no válido.";
  return undefined;
}
