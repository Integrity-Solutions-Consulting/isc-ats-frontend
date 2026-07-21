'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, X } from 'lucide-react';
import { SOCIAL_LINKS } from '../constants/socialLinks';

export function SocialFloatingBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
      {open && (
        <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-sm transition-colors hover:border-primary hover:text-primary"
            >
              {social.icon}
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar redes sociales' : 'Ver redes sociales'}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-brand-md transition-transform hover:scale-105"
      >
        {open ? <X size={20} /> : <Share2 size={20} />}
      </button>
    </div>
  );
}
