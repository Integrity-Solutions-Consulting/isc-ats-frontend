import { z } from 'zod';
import { validateCedulaEC, validatePassport, validatePhone } from '@/shared/utils';

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ\s'-]+$/;

function notFuture(dateStr: string): boolean {
  const dob = new Date(dateStr);
  return !isNaN(dob.getTime()) && dob <= new Date();
}

function minAge(years: number) {
  return (dateStr: string) => {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return false;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    return dob <= cutoff;
  };
}

function maxAge(years: number) {
  return (dateStr: string) => {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return false;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    return dob >= cutoff;
  };
}

export const step1Schema = z
  .object({
    docType: z.enum(['cedula', 'passport']),
    firstName: z
      .string()
      .trim()
      .min(2, 'Ingresa tu nombre completo')
      .max(80, 'Máximo 80 caracteres')
      .refine((v) => NAME_REGEX.test(v), { message: 'El nombre solo puede contener letras' }),
    lastName: z
      .string()
      .trim()
      .min(2, 'Ingresa tus apellidos completos')
      .max(80, 'Máximo 80 caracteres')
      .refine((v) => NAME_REGEX.test(v), { message: 'Los apellidos solo pueden contener letras' }),
    idNumber: z.string().trim().min(1, 'Ingresa tu documento de identidad'),
    birthDate: z
      .string()
      .optional()
      .refine((v) => !v || notFuture(v), {
        message: 'La fecha de nacimiento no puede ser futura.',
      })
      .refine((v) => !v || minAge(18)(v), {
        message: 'Debes tener al menos 18 años para registrarte.',
      })
      .refine((v) => !v || maxAge(65)(v), {
        message: 'La edad máxima permitida es de 65 años.',
      }),
    phone: z
      .string()
      .min(1, 'Ingresa tu número de celular')
      .refine(validatePhone, {
        message: 'Ingresa un número válido (ej: 0991234567 o +12025551234)',
      }),
    homeAddress: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.docType === 'cedula') {
      if (!validateCedulaEC(data.idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idNumber'],
          message: 'Cédula inválida. Verifica el número ingresado.',
        });
      }
    } else {
      if (!validatePassport(data.idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idNumber'],
          message: 'Pasaporte inválido. Debe tener entre 6 y 20 caracteres alfanuméricos.',
        });
      }
    }
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
  completedCareer: z.string().optional(),
  title: z.string().optional(),
  university: z.string().optional(),
  city: z.string().min(1, 'Selecciona tu ciudad'),
  isStudying: booleanRequired('Indica si estudias actualmente'),
  isWorking: booleanRequired('Indica si trabajas actualmente'),
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
