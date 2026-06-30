/**
 * Frontend permission gating — UX defense-in-depth.
 *
 * These codes mirror the backend permission catalog (permissions_catalog.py).
 * They drive which sidebar entries the user sees and which staff routes they may
 * open. The real authorization boundary stays server-side: every endpoint guards
 * itself with require_permission, so hiding UI here never grants or removes
 * actual access — it only avoids showing dead options and broken pages.
 *
 * The "view" (read) code of a section is what gates entering it.
 */
export const PERM = {
  vacancies: 'recruitment.vacancies.read',
  talentPool: 'talent.talent_pool.read',
  profileTemplates: 'org.profile_templates.read',
  processes: 'org.processes.read',
  clients: 'org.client_companies.read',
  contacts: 'org.contacts.read',
  parameters: 'org.parameters.read',
  users: 'auth.users.read',
  roles: 'auth.roles.read',
} as const;

export type PermissionCode = (typeof PERM)[keyof typeof PERM];

/**
 * Route prefix → permission required to enter it. Matched longest-prefix-first,
 * so a child route (e.g. /vacantes/123) inherits its section's permission.
 *
 * Routes absent from this list (dashboard "/", "/mi-perfil") need no special
 * permission and stay reachable by any authenticated staff user.
 */
const ROUTE_PERMISSIONS: { prefix: string; permission: PermissionCode }[] = [
  { prefix: '/configuracion/plantillas', permission: PERM.profileTemplates },
  { prefix: '/configuracion/procesos', permission: PERM.processes },
  { prefix: '/configuracion/clientes', permission: PERM.clients },
  { prefix: '/configuracion/contactos', permission: PERM.contacts },
  { prefix: '/configuracion/catalogos', permission: PERM.parameters },
  { prefix: '/configuracion/departamentos', permission: PERM.parameters },
  { prefix: '/configuracion/usuarios', permission: PERM.users },
  { prefix: '/configuracion/roles', permission: PERM.roles },
  { prefix: '/vacantes', permission: PERM.vacancies },
  { prefix: '/banco-talento', permission: PERM.talentPool },
  { prefix: '/reportes', permission: PERM.vacancies },
];

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * The permission required to open `path`, or null when the route is open to any
 * staff user. Strips the query string and picks the most specific matching
 * prefix so nested config routes are not shadowed by a shorter sibling.
 */
export function permissionForPath(path: string): PermissionCode | null {
  const clean = path.split('?')[0];
  let best: { prefix: string; permission: PermissionCode } | null = null;
  for (const entry of ROUTE_PERMISSIONS) {
    if (matchesPrefix(clean, entry.prefix)) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best?.permission ?? null;
}
