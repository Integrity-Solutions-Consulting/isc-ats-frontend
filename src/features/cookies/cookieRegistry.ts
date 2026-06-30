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
  purpose: string;
  duration: string;
}

export const NECESSARY_COOKIES: CookieDescriptor[] = [
  {
    name: 'access-token',
    purpose: 'Mantiene tu sesión iniciada de forma segura. No es accesible por scripts.',
    duration: '30 minutos',
  },
  {
    name: 'refresh-token',
    purpose: 'Renueva tu sesión para que no tengas que volver a iniciar sesión cada vez.',
    duration: '7 días',
  },
  {
    name: 'session-user',
    purpose: 'Guarda datos básicos de tu perfil (nombre, iniciales) para mostrarlos en la interfaz.',
    duration: '7 días',
  },
];
