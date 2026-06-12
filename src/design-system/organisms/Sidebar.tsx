import Link from "next/link";

import { cn } from "@/shared/utils";
import type { NavGroup } from "@/shared/constants/navigation";

interface SidebarProps {
  groups: NavGroup[];
  /** Path used to highlight the active item. The app layer decides what
   *  counts as "current" (it may differ from the URL pathname). */
  currentPath: string;
  className?: string;
  version?: string;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Portal navigation rail (dark surface). Highlights the active route. */
export function Sidebar({ groups, currentPath, className, version = "v0.1.0" }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-1 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-foreground",
        className,
      )}
    >
      {groups.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/45">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = isActive(currentPath, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-sidebar-primary" />
                )}
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto flex items-center justify-between border-t border-white/10 px-2 pt-3 text-xs text-sidebar-foreground/50">
        <span>© Integrity Solutions</span>
        <span>{version}</span>
      </div>
    </aside>
  );
}
