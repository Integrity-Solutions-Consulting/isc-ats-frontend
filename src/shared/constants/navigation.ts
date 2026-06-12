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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Exact-match active state (used for the dashboard root). */
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** Portal sidebar navigation. Visibility is later filtered by usePermissions. */
export const PORTAL_NAV: NavGroup[] = [
  {
    items: [
      { label: "Inicio", href: ROUTES.dashboard, icon: Home, exact: true },
      { label: "Vacantes", href: ROUTES.vacantes, icon: Briefcase },
      { label: "Banco de talento", href: ROUTES.bancoTalento, icon: Users2 },
      { label: "Plantillas de cargo", href: ROUTES.configuracion.plantillas, icon: FileText },
      { label: "Procesos", href: ROUTES.configuracion.procesos, icon: Workflow },
    ],
  },
  {
    label: "Configuración",
    items: [
      { label: "Clientes", href: ROUTES.configuracion.clientes, icon: Building },
      { label: "Contactos", href: ROUTES.configuracion.contactos, icon: Contact },
      { label: "Catálogos", href: ROUTES.configuracion.catalogos, icon: ListChecks },
      { label: "Usuarios", href: ROUTES.configuracion.usuarios, icon: UserCog },
      { label: "Roles y permisos", href: ROUTES.configuracion.roles, icon: Shield },
    ],
  },
];
