"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/utils";
import { useBreadcrumbStore } from "@/shared/stores/breadcrumbStore";
import { ROUTES } from "@/shared/constants/routes";

const BREADCRUMB_MAP: { pattern: RegExp; crumbs: string[] }[] = [
  // Vacantes
  { pattern: /^\/vacantes\/nueva$/, crumbs: ["Vacantes", "Nueva vacante"] },
  { pattern: /^\/vacantes\/[^/]+\/editar$/, crumbs: ["Vacantes", "Editar vacante"] },
  { pattern: /^\/vacantes\/[^/]+\/candidato\/[^/]+$/, crumbs: ["Vacantes", ":vacancy", "Candidato"] },
  { pattern: /^\/vacantes\/[^/]+$/, crumbs: ["Vacantes", ":vacancy"] },
  // Configuración — procesos (detail before list to avoid conflict)
  { pattern: /^\/configuracion\/procesos\/nuevo$/, crumbs: ["Procesos", "Nuevo proceso"] },
  { pattern: /^\/configuracion\/procesos\/[^/]+$/, crumbs: ["Procesos", ":pageTitle"] },
  { pattern: /^\/configuracion\/procesos$/, crumbs: ["Configuración", "Procesos"] },
  // Configuración — resto
  { pattern: /^\/configuracion\/usuarios$/, crumbs: ["Configuración", "Usuarios"] },
  { pattern: /^\/configuracion\/roles$/, crumbs: ["Configuración", "Roles y permisos"] },
  { pattern: /^\/configuracion\/departamentos$/, crumbs: ["Configuración", "Departamentos"] },
  { pattern: /^\/configuracion\/plantillas\/nueva$/, crumbs: ["Plantillas de cargo", "Nueva plantilla"] },
  { pattern: /^\/configuracion\/plantillas\/[^/]+\/editar$/, crumbs: ["Plantillas de cargo", ":pageTitle", "Editar"] },
  { pattern: /^\/configuracion\/plantillas\/[^/]+$/, crumbs: ["Plantillas de cargo", ":pageTitle"] },
  { pattern: /^\/configuracion\/plantillas$/, crumbs: ["Configuración", "Plantillas de cargo"] },
  { pattern: /^\/configuracion\/catalogos$/, crumbs: ["Configuración", "Catálogos"] },
  { pattern: /^\/configuracion\/clientes$/, crumbs: ["Configuración", "Clientes"] },
  { pattern: /^\/configuracion\/contactos$/, crumbs: ["Configuración", "Contactos"] },
];

// Links for each raw crumb token
const CRUMB_HREF: Record<string, string> = {
  "Vacantes": ROUTES.vacantes,
  "Banco de talento": ROUTES.bancoTalento,
  "Procesos": ROUTES.configuracion.procesos,
  "Plantillas de cargo": ROUTES.configuracion.plantillas,
  "Configuración": "", // no page, non-clickable
};

/**
 * Staff portal breadcrumb. Owns the app-route knowledge (path patterns + crumb
 * links) so the design-system Header stays a pure layout shell — the Header
 * just renders this through its `breadcrumb` slot.
 */
export function PortalBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const vacancyName = useBreadcrumbStore((s) => s.vacancyName);
  const pageTitle   = useBreadcrumbStore((s) => s.pageTitle);

  const match = BREADCRUMB_MAP.find((r) => r.pattern.test(pathname));
  if (!match) return null;

  const vacancyId = pathname.match(/^\/vacantes\/([^/]+)/)?.[1];

  // When coming from the talent pool, override the candidato breadcrumb
  const rawCrumbs =
    from === "banco-talento" && match.crumbs[0] === "Vacantes"
      ? ["Banco de talento", "Candidato"]
      : match.crumbs;

  const resolvedCrumbs = rawCrumbs.map((raw) => {
    if (raw === ":vacancy")   return vacancyName ?? "…";
    if (raw === ":pageTitle") return pageTitle   ?? "…";
    return raw;
  });

  function getHref(index: number, raw: string): string | null {
    if (index === resolvedCrumbs.length - 1) return null;
    if (raw === ":vacancy") return vacancyId ? ROUTES.vacante(vacancyId) : null;
    if (raw === ":pageTitle") return null;
    const href = CRUMB_HREF[raw];
    return href || null;
  }

  return (
    <nav aria-label="Ruta actual" className="flex items-center gap-1 text-sm">
      {resolvedCrumbs.map((crumb, i) => {
        const href = getHref(i, rawCrumbs[i]);
        return (
          <span key={rawCrumbs[i]} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-ink-subtle" />}
            {href ? (
              <Link href={href} className="text-ink-muted transition-colors hover:text-primary-700">
                {crumb}
              </Link>
            ) : (
              <span className={cn(i === resolvedCrumbs.length - 1 ? "font-medium text-ink" : "text-ink-muted")}>
                {crumb}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
