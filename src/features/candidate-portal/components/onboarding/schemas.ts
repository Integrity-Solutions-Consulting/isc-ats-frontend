import { z } from 'zod';
import { validateCedulaEC, validatePhoneEC } from '@/shared/utils';

// ─── Ecuador Zod schemas ──────────────────────────────────────────────────────

function minAge(minYears: number) {
  return (dateStr: string) => {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    const cutoff = new Date(today.getFullYear() - minYears, today.getMonth(), today.getDate());
    return dob <= cutoff;
  };
}

export const step1Schema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa tu nombre').max(80, 'Máximo 80 caracteres'),
  lastName: z.string().trim().min(1, 'Ingresa tus apellidos').max(80, 'Máximo 80 caracteres'),
  idNumber: z
    .string()
    .trim()
    .min(1, 'Ingresa tu cédula o pasaporte')
    .refine(
      (v) => {
        // If it looks like a cédula (10 digits), apply the EC check
        if (/^\d{10}$/.test(v)) return validateCedulaEC(v);
        // Otherwise accept it as a passport (at least 5 chars)
        return v.length >= 5;
      },
      { message: 'Cédula inválida. Verifica el número ingresado.' },
    ),
  birthDate: z
    .string()
    .optional()
    .refine((v) => !v || minAge(18)(v), {
      message: 'Debes tener al menos 18 años para registrarte.',
    }),
  phone: z
    .string()
    .min(1, 'Ingresa tu número de celular')
    .refine(validatePhoneEC, {
      message: 'Ingresa un número válido (ej: 0991234567 o +593991234567)',
    }),
  homeAddress: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
});

// isStudying / isWorking are stored as boolean | undefined until the toggle is pressed.
// We treat undefined as an invalid state with a custom message.
const booleanRequired = (msg: string) =>
  z
    .boolean()
    .nullable()
    .refine((v): v is boolean => v !== null, { message: msg });

export const step2Schema = z.object({
  educationLevel: z.string().min(1, 'Selecciona tu nivel de educación'),
  // career (study field) and title (degree) are separate parameter ids as strings
  completedCareer: z.string().optional(),
  title: z.string().optional(),
  university: z.string().optional(),
  city: z.string().min(1, 'Selecciona tu ciudad'),
  isStudying: booleanRequired('Indica si estudias actualmente'),
  isWorking: booleanRequired('Indica si trabajas actualmente'),
  currentCompany: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;

/** Form-layer type: toggle fields start as null before user interaction. */
export interface Step2FormValues extends Omit<Step2Values, 'isStudying' | 'isWorking'> {
  isStudying: boolean | null;
  isWorking: boolean | null;
  university?: string;
}

export interface Step3Data {
  file: File | null;
}
