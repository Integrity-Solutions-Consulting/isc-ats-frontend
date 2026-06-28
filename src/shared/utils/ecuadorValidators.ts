/**
 * Ecuador-specific field validators.
 *
 * validateCedulaEC  — Validates an Ecuadorian cédula de identidad (10 digits).
 *   Algorithm: Luhn-style modulus-10 check used by the Registro Civil.
 *   - First two digits = province code (01–24).
 *   - Third digit must be < 6 (natural person) for the standard check digit.
 *   - Digits 1–9 weighted [2,1,2,1,2,1,2,1,2]; if product ≥ 10 subtract 9.
 *   - Sum of products mod 10 must equal digit 10.
 *
 * validatePhoneEC — Validates an Ecuadorian mobile number.
 *   Accepts: 09XXXXXXXX (10 digits) or +5939XXXXXXXX (13 chars including "+").
 */

export function validateCedulaEC(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;

  const province = parseInt(value.slice(0, 2), 10);
  if (province < 1 || province > 24) return false;

  const thirdDigit = parseInt(value[2], 10);
  if (thirdDigit >= 6) return false; // Only natural persons; RUC/juridical entities differ

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let product = parseInt(value[i], 10) * coefficients[i];
    if (product >= 10) product -= 9;
    total += product;
  }

  const remainder = total % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit === parseInt(value[9], 10);
}

export function validatePhoneEC(value: string): boolean {
  // Accepts: 09XXXXXXXX  (10 digits, starts with 09)
  //       or +5939XXXXXXXX (country code +593 then 9XXXXXXXX)
  return /^09\d{8}$/.test(value) || /^\+5939\d{8}$/.test(value);
}

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Mirror of the backend password policy (app/shared/validators.py).
 * Returns a Spanish (Ecuador) error message for a weak password, or null when it
 * meets the policy: at least PASSWORD_MIN_LENGTH chars with one lowercase, one
 * uppercase, one digit and one special character.
 */
export function passwordPolicyError(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[a-z]/.test(value)) return 'La contraseña debe incluir al menos una letra minúscula';
  if (!/[A-Z]/.test(value)) return 'La contraseña debe incluir al menos una letra mayúscula';
  if (!/\d/.test(value)) return 'La contraseña debe incluir al menos un número';
  if (!/[^a-zA-Z0-9]/.test(value)) return 'La contraseña debe incluir al menos un carácter especial';
  return null;
}

/**
 * Live requirements checklist for a password field — each rule ticks as the user
 * types, so the form states exactly what is missing instead of a vague strength
 * meter. Shared by the registration and password-reset forms; mirrors the policy
 * enforced by passwordPolicyError (and the backend).
 */
export const PASSWORD_REQUIREMENTS: { label: string; test: (pw: string) => boolean }[] = [
  { label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { label: 'Una letra minúscula', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Una letra mayúscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Un número', test: (pw) => /\d/.test(pw) },
  { label: 'Un carácter especial', test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
];
