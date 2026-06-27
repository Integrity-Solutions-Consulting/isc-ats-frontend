"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react";

import { cn } from "@/shared/utils";

interface HeaderProps {
  user: { name: string; initials: string };
  profileHref: string;
  onLogout?: () => void;
  breadcrumb?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
  onBellClick?: () => void;
  hasUnread?: boolean;
  className?: string;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) onClose();
  };
  return {
    attach: () => document.addEventListener("mousedown", handler),
    detach: () => document.removeEventListener("mousedown", handler),
  };
}

/** Portal top bar: breadcrumb slot, global search, notifications bell slot, user menu. */
export function Header({
  user,
  profileHref,
  onLogout,
  breadcrumb,
  notificationsSlot,
  onBellClick,
  hasUnread = false,
  className,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setShowMenu(false);

  return (
    <header
      className={cn(
        "relative flex items-center gap-4 border-b border-border bg-surface px-6",
        className,
      )}
    >
      <div className="shrink-0">{breadcrumb}</div>

      <div className="flex h-9 min-w-[120px] max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-bg px-4 text-sm">
        <Search className="size-4 text-ink-subtle" />
        <input
          type="search"
          placeholder="Buscar vacantes, candidatos, contactos…"
          className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle"
        />
        <kbd className="hidden rounded border border-border px-1.5 text-xs text-ink-subtle sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={onBellClick}
          className="relative grid size-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          <Bell className="size-5" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </button>

        {notificationsSlot}

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            onBlur={(e) => {
              if (!menuRef.current?.contains(e.relatedTarget as Node)) closeMenu();
            }}
            className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-primary-50"
          >
            <span className="hidden text-sm font-medium text-ink md:inline">
              {user.name}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-ink-subtle transition-transform",
                showMenu && "rotate-180",
              )}
            />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
              <Link
                href={profileHref}
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-primary-50"
              >
                <User className="size-4 text-ink-muted" />
                Ver perfil
              </Link>
              <div className="h-px bg-border" />
              <button
                type="button"
                onClick={() => { closeMenu(); onLogout?.(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/5"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
