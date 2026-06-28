/**
 * Field validators for Ecuador and international formats.
 *
 * validateCedulaEC  — Ecuadorian cédula de identidad (10 digits, Registro Civil algorithm).
 * validatePassport  — International passport: 6–20 alphanumeric characters.
 * validatePhoneEC   — Ecuador-only mobile: 09XXXXXXXX or +5939XXXXXXXX.
 * validatePhone     — EC mobile OR any international E.164 (+7-15 digits).
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

export function validatePassport(value: string): boolean {
  return /^[A-Z0-9]{6,20}$/i.test(value.trim());
}

export function validatePhoneEC(value: string): boolean {
  return /^09\d{8}$/.test(value) || /^\+5939\d{8}$/.test(value);
}

export function validatePhone(value: string): boolean {
  // Ecuador mobile (local or with country code)
  if (/^09\d{8}$/.test(value) || /^\+5939\d{8}$/.test(value)) return true;
  // Any international E.164: + followed by 7–15 digits
  return /^\+\d{7,15}$/.test(value);
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
