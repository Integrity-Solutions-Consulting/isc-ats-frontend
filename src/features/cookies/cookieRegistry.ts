/**
 * The complete set of cookies this app stores, surfaced to the user at the
 * consent moment for transparency (LOPDP / GDPR best practice). All are
 * strictly necessary — there are no analytics, tracking, or advertising cookies.
 *
 * Keep this list in sync with where the cookies are actually set:
 *   - access-token / refresh-token → src/app/api/auth/login/route.ts
 *   - session-user                 → src/lib/sessionCookie.ts
 */
export interface CookieDescriptor {
  name: string;
  label: string;
  purpose: string;
  duration: string;
}

export const NECESSARY_COOKIES: CookieDescriptor[] = [
  {
    name: 'access-token',
    label: 'Token de acceso',
    purpose: 'Mantiene tu sesión iniciada de forma segura.',
    duration: '30 minutos',
  },
  {
    name: 'refresh-token',
    label: 'Token de renovación',
    purpose: 'Renueva tu sesión para que no tengas que volver a iniciar sesión cada vez.',
    duration: '7 días',
  },
  {
    name: 'session-user',
    label: 'Datos de sesión',
    purpose: 'Guarda datos básicos de tu perfil (nombre, iniciales) para mostrarlos en la interfaz.',
    duration: '7 días',
  },
];
