// ─── System-defined permissions (not user-created) ───────────────────────────

export interface PermDef {
  id: string;
  label: string;
  dangerous?: boolean;
}

export interface ModuleDef {
  id: string;
  label: string;
  accent: string;
  permissions: PermDef[];
}

export const MODULES: ModuleDef[] = [
  {
    id: 'vacancies', label: 'Vacantes', accent: 'bg-warning/15 text-warning',
    permissions: [
      { id: 'vacancies.view',    label: 'Ver vacantes' },
      { id: 'vacancies.create',  label: 'Crear vacante' },
      { id: 'vacancies.edit',    label: 'Editar vacante' },
      { id: 'vacancies.delete',  label: 'Eliminar vacante', dangerous: true },
      { id: 'vacancies.publish', label: 'Publicar vacante' },
    ],
  },
  {
    id: 'candidates', label: 'Candidatos', accent: 'bg-primary-100 text-primary-700',
    permissions: [
      { id: 'candidates.view',   label: 'Ver candidatos' },
      { id: 'candidates.move',   label: 'Mover entre etapas' },
      { id: 'candidates.notes',  label: 'Agregar notas' },
      { id: 'candidates.reject', label: 'Rechazar candidato', dangerous: true },
    ],
  },
  {
    id: 'talent', label: 'Banco de talento', accent: 'bg-module-orange-bg text-module-orange-fg',
    permissions: [
      { id: 'talent.view',   label: 'Ver banco' },
      { id: 'talent.add',    label: 'Agregar al banco' },
      { id: 'talent.remove', label: 'Remover del banco', dangerous: true },
    ],
  },
  {
    id: 'processes', label: 'Procesos', accent: 'bg-success/15 text-success',
    permissions: [
      { id: 'processes.view',   label: 'Ver procesos' },
      { id: 'processes.create', label: 'Crear proceso' },
      { id: 'processes.edit',   label: 'Editar proceso' },
      { id: 'processes.delete', label: 'Eliminar proceso', dangerous: true },
    ],
  },
  {
    id: 'reports', label: 'Reportes', accent: 'bg-module-purple-bg text-module-purple-fg',
    permissions: [
      { id: 'reports.view', label: 'Ver reportes' },
    ],
  },
  {
    id: 'users', label: 'Usuarios', accent: 'bg-module-neutral-bg text-module-neutral-fg',
    permissions: [
      { id: 'users.view',   label: 'Ver usuarios' },
      { id: 'users.create', label: 'Crear usuario' },
      { id: 'users.edit',   label: 'Editar usuario' },
      { id: 'users.delete', label: 'Eliminar usuario', dangerous: true },
    ],
  },
  {
    id: 'roles', label: 'Roles', accent: 'bg-danger/15 text-danger',
    permissions: [
      { id: 'roles.manage', label: 'Gestionar roles y permisos', dangerous: true },
    ],
  },
  {
    id: 'config', label: 'Configuración', accent: 'bg-warning/15 text-warning',
    permissions: [
      { id: 'config.manage', label: 'Gestionar catálogos, plantillas y departamentos' },
    ],
  },
];

export const ALL_PERMISSION_IDS = MODULES.flatMap((m) => m.permissions.map((p) => p.id));
export const TOTAL_PERMS = ALL_PERMISSION_IDS.length;
