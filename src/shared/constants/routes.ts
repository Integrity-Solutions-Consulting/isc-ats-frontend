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
  /**
   * Pipeline stage the profile was opened from. It pins the prev/next queue to
   * that stage, so moving a candidate forward does not empty the navigator.
   */
  stageId?: string;
  /**
   * Board filters, carried verbatim so the profile's queue matches the board
   * the recruiter came from and the back link restores it untouched.
   */
  filters?: Record<string, string>;
}

/** Extra params are set last so a caller can never drop a required one. */
function appendExtra(params: URLSearchParams, extra?: Record<string, string>): void {
  if (!extra) return;
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
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
  if (query.stageId) params.set('stageId', query.stageId);
  appendExtra(params, query.filters);

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

interface VacancyQuery {
  tab?: string;
  /** Pipeline filters to restore when returning to the board. */
  filters?: Record<string, string>;
}

function vacancy(id: string, query?: VacancyQuery): string {
  const base = `/vacantes/${id}`;
  if (!query) return base;

  const params = new URLSearchParams();
  if (query.tab) params.set('tab', query.tab);
  appendExtra(params, query.filters);

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
  // Mandatory password change for accounts provisioned with a temporary password.
  cambiarContrasena: '/cambiar-contrasena',
  publicVacantes: '/empleos',
  publicVacante: (id: string) => `/empleos/${id}`,

  // (staff) — internal Integrity portal
  dashboard: '/',
  vacantes: '/vacantes',
  vacanteNueva: '/vacantes/nueva',
  vacante: vacancy,
  vacanteEditar: (id: string) => `/vacantes/${id}/editar`,
  candidatoEnVacante: candidateInVacancy,
  entrevistas: '/entrevistas',
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
    usuarios: '/configuracion/usuarios',
    roles: '/configuracion/roles',
    suscriptores: '/configuracion/suscriptores',
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
