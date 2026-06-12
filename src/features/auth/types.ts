import { z } from "zod";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu correo")
    .refine((v) => EMAIL_RE.test(v), "Correo no válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type UserRole = "hr_staff" | "candidate";

export interface AuthUser {
  name: string;
  initials: string;
  role: UserRole;
  has_profile?: boolean;
}

export interface AuthSession {
  user: AuthUser;
}
