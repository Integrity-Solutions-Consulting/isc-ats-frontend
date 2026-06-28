/**
 * Single source of truth for application URLs.
 *
 * Static routes are string constants; dynamic routes are builder functions
 * that take their path params. Route groups — (public), (staff), (candidate) —
 * are invisible in the URL, so they do not appear here.
 *
 * Always reference ROUTES instead of hardcoding path strings, so a route
 * rename is a one-line change and params are type-checked.
 */

interface CandidateInVacancyQuery {
  /** Application id, when navigating from a pipeline list. */
  appId?: string;
  /** Set when navigating from the talent pool (read-only profile). */
  from?: 'banco-talento';
  /** 1-based position within the current navigation set. */
  pos?: number;
  /** Total size of the current navigation set. */
  total?: number;
  /** Talent-pool entry id, preserved for back navigation. */
  tpId?: string;
}

function candidateInVacancy(
  vacancyId: string,
  candidateId: string,
  query?: CandidateInVacancyQuery,
): string {
  const base = `/vacantes/${vacancyId}/candidato/${candidateId}`;
  if (!query) return base;

  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.appId) params.set('appId', query.appId);
  if (query.pos != null) params.set('pos', String(query.pos));
  if (query.total != null) params.set('total', String(query.total));
  if (query.tpId) params.set('tpId', query.tpId);

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const ROUTES = {
  // (public) — no session required
  login: '/login',
  registro: '/registro',
  registroVerificacion: '/registro/verificacion',
  recuperarContrasena: '/recuperar-contrasena',
  restablecerContrasena: '/restablecer-contrasena',
  publicVacantes: '/empleos',
  publicVacante: (id: string) => `/empleos/${id}`,

  // (staff) — internal Integrity portal
  dashboard: '/',
  vacantes: '/vacantes',
  vacanteNueva: '/vacantes/nueva',
  vacante: (id: string) => `/vacantes/${id}`,
  vacanteEditar: (id: string) => `/vacantes/${id}/editar`,
  candidatoEnVacante: candidateInVacancy,
  bancoTalento: '/banco-talento',
  bancoTalentoCandidate: (candidateId: string, opts?: { pos?: number; total?: number; tpId?: string }) => {
    const base = `/banco-talento/${candidateId}`;
    if (!opts) return base;
    const params = new URLSearchParams();
    if (opts.pos != null) params.set('pos', String(opts.pos));
    if (opts.total != null) params.set('total', String(opts.total));
    if (opts.tpId) params.set('tpId', opts.tpId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  },
  miPerfil: '/mi-perfil',
  reportes: '/reportes',
  configuracion: {
    plantillas: '/configuracion/plantillas',
    plantillaNueva: '/configuracion/plantillas/nueva',
    plantilla: (id: string) => `/configuracion/plantillas/${id}`,
    procesos: '/configuracion/procesos',
    procesoNuevo: '/configuracion/procesos/nuevo',
    proceso: (id: string) => `/configuracion/procesos/${id}`,
    clientes: '/configuracion/clientes',
    contactos: '/configuracion/contactos',
    catalogos: '/configuracion/catalogos',
    departamentos: '/configuracion/departamentos',
    usuarios: '/configuracion/usuarios',
    roles: '/configuracion/roles',
  },

  // (candidate) — candidate-facing portal
  candidato: {
    vacantes: '/candidato/vacantes',
    vacante: (id: string) => `/candidato/vacantes/${id}`,
    misPostulaciones: '/candidato/mis-postulaciones',
    miPerfil: '/candidato/mi-perfil',
    onboarding: '/candidato/onboarding',
  },
} as const;
