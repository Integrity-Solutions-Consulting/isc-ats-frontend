'use client';

import { useId, useState } from 'react';
import { Popover } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { normalizeText } from '../filters';

interface TechnologyFilterProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export function TechnologyFilter({ options, selected, onChange, disabled }: TechnologyFilterProps) {
  const [query, setQuery] = useState('');
  const id = useId();
  const selectedKeys = new Set(selected.map(normalizeText));
  // Keep selections from shared URLs available even if their candidates disappeared.
  const choices = [...selected, ...options.filter((option) => !selectedKeys.has(normalizeText(option)))];
  const visible = choices.filter((option) => normalizeText(option).includes(normalizeText(query.trim())));

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
      <span id={`${id}-label`} className="text-xs font-medium text-ink-muted">Tecnologías y conocimientos</span>
      <Popover.Root onOpenChange={() => setQuery('')}>
        <Popover.Trigger asChild>
          <Button type="button" variant="outline" disabled={disabled} aria-labelledby={`${id}-label ${id}-value`} className="w-full justify-between bg-surface-2/50 font-normal shadow-none">
            <span id={`${id}-value`}>{selected.length ? `${selected.length} seleccionados` : 'Seleccionar'}</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={4} aria-labelledby={`${id}-label`} className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface p-3 shadow-lg">
            <label htmlFor={`${id}-search`} className="mb-2 block text-sm font-medium text-ink">Buscar tecnología o conocimiento</label>
            <Input id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe una palabra" />
            <p className="my-2 text-xs text-ink-muted">Deben tener todos los seleccionados.</p>
            <div className="max-h-60 overflow-y-auto" role="group" aria-label="Opciones de tecnologías y conocimientos">
              {visible.map((option) => (
                <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2 rounded px-2 text-sm text-ink hover:bg-surface-2">
                  <input type="checkbox" className="size-4 shrink-0 accent-primary-600" checked={selectedKeys.has(normalizeText(option))} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((value) => normalizeText(value) !== normalizeText(option)))} />
                  <span className="break-words">{option}</span>
                </label>
              ))}
              {visible.length === 0 && <p role="status" className="py-3 text-sm text-ink-muted">No se encontraron coincidencias.</p>}
            </div>
            {selected.length > 0 && <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange([])}>Limpiar selección</Button>}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
