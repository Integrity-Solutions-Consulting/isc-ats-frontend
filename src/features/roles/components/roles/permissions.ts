// ─── Permission catalog model ────────────────────────────────────────────────
//
// The Roles screen is driven by the real backend catalog (GET /auth/permissions),
// not a hardcoded list. Permission identity is the backend code
// "{module}.{resource}.{action}". This module turns the flat catalog into a
// module → resource → action tree with Spanish (es-EC) labels.

/** A permission as returned by the backend catalog. */
export interface CatalogPermission {
  id: number;
  code: string;
  name: string;
  module: string | null;
}

export interface PermissionLeaf {
  code: string;
  action: string;
  actionLabel: string;
  dangerous: boolean;
}

export interface ResourceGroup {
  key: string;
  label: string;
  permissions: PermissionLeaf[];
}

export interface ModuleGroup {
  key: string;
  label: string;
  accent: string;
  resources: ResourceGroup[];
}

// ─── Spanish labels ──────────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; accent: string; order: number }> = {
  recruitment: { label: 'Reclutamiento', accent: 'bg-primary-100 text-primary-700', order: 1 },
  org: { label: 'Organización', accent: 'bg-success/15 text-success', order: 2 },
  talent: { label: 'Banco de talento', accent: 'bg-module-orange-bg text-module-orange-fg', order: 3 },
  comms: { label: 'Comunicaciones', accent: 'bg-module-purple-bg text-module-purple-fg', order: 4 },
  storage: { label: 'Archivos', accent: 'bg-warning/15 text-warning', order: 5 },
  ai: { label: 'Inteligencia artificial', accent: 'bg-module-purple-bg text-module-purple-fg', order: 6 },
  auth: { label: 'Seguridad y accesos', accent: 'bg-danger/15 text-danger', order: 7 },
};

const RESOURCE_LABELS: Record<string, string> = {
  // org
  parameters: 'Catálogos',
  departments: 'Departamentos',
  client_companies: 'Empresas cliente',
  contacts: 'Contactos',
  processes: 'Procesos',
  process_stages: 'Etapas de proceso',
  profile_templates: 'Plantillas de cargo',
  profile_template_items: 'Ítems de plantilla',
  // auth
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  user_roles: 'Asignación de roles a usuarios',
  role_permissions: 'Permisos por rol',
  menu_items: 'Menú de navegación',
  // recruitment
  vacancies: 'Vacantes',
  candidates: 'Candidatos',
  applications: 'Postulaciones',
  application_documents: 'Documentos de postulación',
  application_notes: 'Notas de postulación',
  interviews: 'Entrevistas',
  interviewer_availability: 'Disponibilidad de entrevistadores',
  // talent
  talent_pool: 'Banco de talento',
  // comms
  notifications: 'Notificaciones',
  email_logs: 'Registro de correos',
  // storage
  files: 'Archivos',
  // ai
  cv_parse_jobs: 'Procesamiento de CV',
  vacancy_promo_images: 'Imágenes promocionales',
  ai_usage_logs: 'Registro de uso de IA',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'Ver',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  assign: 'Asignar',
  revoke: 'Revocar',
  grant: 'Otorgar',
};

const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'assign', 'grant', 'revoke'];
const DANGEROUS_ACTIONS = new Set(['delete', 'revoke']);
const DEFAULT_ACCENT = 'bg-surface-2 text-ink-subtle';

/** Humanizes an unknown snake_case key as a readable fallback label. */
function humanize(key: string): string {
  if (!key) return key;
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function actionRank(action: string): number {
  const i = ACTION_ORDER.indexOf(action);
  return i === -1 ? ACTION_ORDER.length : i;
}

/**
 * Builds the module → resource → action tree from the flat backend catalog.
 * Pure: same input always yields the same ordered tree.
 */
export function buildPermissionTree(permissions: CatalogPermission[]): ModuleGroup[] {
  const moduleMap = new Map<string, Map<string, PermissionLeaf[]>>();

  for (const p of permissions) {
    const [moduleKey = 'otros', resourceKey = p.code, action = ''] = p.code.split('.');
    if (!moduleMap.has(moduleKey)) moduleMap.set(moduleKey, new Map());
    const resMap = moduleMap.get(moduleKey)!;
    if (!resMap.has(resourceKey)) resMap.set(resourceKey, []);
    resMap.get(resourceKey)!.push({
      code: p.code,
      action,
      actionLabel: ACTION_LABELS[action] ?? humanize(action),
      dangerous: DANGEROUS_ACTIONS.has(action),
    });
  }

  const modules: ModuleGroup[] = [];
  for (const [moduleKey, resMap] of moduleMap.entries()) {
    const resources: ResourceGroup[] = [...resMap.entries()]
      .map(([resourceKey, leaves]) => ({
        key: resourceKey,
        label: RESOURCE_LABELS[resourceKey] ?? humanize(resourceKey),
        permissions: [...leaves].sort((a, b) => actionRank(a.action) - actionRank(b.action)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    const meta = MODULE_META[moduleKey];
    modules.push({
      key: moduleKey,
      label: meta?.label ?? humanize(moduleKey),
      accent: meta?.accent ?? DEFAULT_ACCENT,
      resources,
    });
  }

  modules.sort(
    (a, b) =>
      (MODULE_META[a.key]?.order ?? 99) - (MODULE_META[b.key]?.order ?? 99) ||
      a.label.localeCompare(b.label, 'es'),
  );
  return modules;
}

/** All permission codes contained in a module (flattened across resources). */
export function moduleCodes(mod: ModuleGroup): string[] {
  return mod.resources.flatMap((r) => r.permissions.map((p) => p.code));
}

/** Total number of permission leaves across the whole tree. */
export function countPermissions(modules: ModuleGroup[]): number {
  return modules.reduce(
    (sum, m) => sum + m.resources.reduce((s, r) => s + r.permissions.length, 0),
    0,
  );
}
