import {
  Home,
  Briefcase,
  Users2,
  UserCog,
  Shield,
  Workflow,
  FileText,
  ListChecks,
  Building,
  Contact,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/shared/constants/routes";
import { PERM, type PermissionCode } from "@/features/auth/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Exact-match active state (used for the dashboard root). */
  exact?: boolean;
  /** Permission required to see this entry. Omitted = visible to any staff user. */
  permission?: PermissionCode;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** Portal sidebar navigation. Entries with a `permission` are filtered out by
 *  PortalSidebar when the user lacks it (see usePermissions). */
export const PORTAL_NAV: NavGroup[] = [
  {
    items: [
      { label: "Inicio", href: ROUTES.dashboard, icon: Home, exact: true },
      { label: "Vacantes", href: ROUTES.vacantes, icon: Briefcase, permission: PERM.vacancies },
      { label: "Banco de talento", href: ROUTES.bancoTalento, icon: Users2, permission: PERM.talentPool },
      { label: "Plantillas de cargo", href: ROUTES.configuracion.plantillas, icon: FileText, permission: PERM.profileTemplates },
      { label: "Procesos", href: ROUTES.configuracion.procesos, icon: Workflow, permission: PERM.processes },
    ],
  },
  {
    label: "Configuración",
    items: [
      { label: "Clientes", href: ROUTES.configuracion.clientes, icon: Building, permission: PERM.clients },
      { label: "Contactos", href: ROUTES.configuracion.contactos, icon: Contact, permission: PERM.contacts },
      { label: "Catálogos", href: ROUTES.configuracion.catalogos, icon: ListChecks, permission: PERM.parameters },
      { label: "Usuarios", href: ROUTES.configuracion.usuarios, icon: UserCog, permission: PERM.users },
      { label: "Roles y permisos", href: ROUTES.configuracion.roles, icon: Shield, permission: PERM.roles },
    ],
  },
];
