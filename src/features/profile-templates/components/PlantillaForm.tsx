'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { createTemplate, updateTemplate } from '../api/profileTemplatesApi';
import type { ProfileTemplateRecord } from '../api/mockData';
import { ROUTES } from '@/shared/constants/routes';

type TagBox = 'knowledge' | 'tools' | 'skills' | 'certifications';
const TAG_BOX_LABELS: Record<TagBox, string> = {
  knowledge: 'Conocimientos',
  tools: 'Herramientas',
  skills: 'Habilidades',
  certifications: 'Certificaciones',
};

function TagsBox({ label, tags, onAdd, onRemove }: {
  label: string; tags: string[];
  onAdd: (t: string) => void; onRemove: (t: string) => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-ink">{label}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            {tag}
            <button type="button" aria-label={`Quitar ${tag}`} onClick={() => onRemove(tag)} className="text-primary-400 hover:text-primary-700">
              <X className="size-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-ink-subtle">Sin etiquetas</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (input.trim()) { onAdd(input.trim()); setInput(''); } } }}
          placeholder="Agregar y presionar Enter…"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}>
          Agregar
        </Button>
      </div>
    </div>
  );
}

interface PlantillaFormProps {
  mode: 'create' | 'edit';
  initialValues?: ProfileTemplateRecord;
}

export function PlantillaForm({ mode, initialValues }: PlantillaFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [knowledge, setKnowledge] = useState<string[]>(initialValues?.knowledge ?? []);
  const [tools, setTools] = useState<string[]>(initialValues?.tools ?? []);
  const [skills, setSkills] = useState<string[]>(initialValues?.skills ?? []);
  const [certifications, setCertifications] = useState<string[]>(initialValues?.certifications ?? []);

  const tagState: Record<TagBox, { value: string[]; set: (v: string[]) => void }> = {
    knowledge: { value: knowledge, set: setKnowledge },
    tools: { value: tools, set: setTools },
    skills: { value: skills, set: setSkills },
    certifications: { value: certifications, set: setCertifications },
  };

  function addTag(box: TagBox, tag: string) {
    tagState[box].set([...tagState[box].value, tag]);
  }

  function removeTag(box: TagBox, tag: string) {
    tagState[box].set(tagState[box].value.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const data = { name: name.trim(), knowledge, tools, skills, certifications, isActive: initialValues?.isActive ?? true };
    try {
      if (mode === 'edit' && initialValues) {
        await updateTemplate(initialValues.id, data);
        queryClient.removeQueries({ queryKey: ['profile-templates'] });
        router.push(ROUTES.configuracion.plantilla(initialValues.id));
      } else {
        const created = await createTemplate(data);
        queryClient.removeQueries({ queryKey: ['profile-templates'] });
        router.push(ROUTES.configuracion.plantilla(created.id));
      }
    } finally {
      setSaving(false);
    }
  }

  const backHref = mode === 'edit' && initialValues
    ? ROUTES.configuracion.plantilla(initialValues.id)
    : ROUTES.configuracion.plantillas;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Volver">
          <Link href={backHref}><ArrowLeft /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-ink">
          {mode === 'create' ? 'Nueva plantilla' : 'Editar plantilla'}
        </h1>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
          <span className="grid size-6 place-items-center rounded-md bg-primary-100 text-xs font-bold text-primary-700">1</span>
          Nombre
        </h2>
        <div className="max-w-sm">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Desarrollador Backend Python"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
          <span className="grid size-6 place-items-center rounded-md bg-primary-100 text-xs font-bold text-primary-700">2</span>
          Perfil requerido
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(TAG_BOX_LABELS) as TagBox[]).map((box) => (
            <TagsBox
              key={box}
              label={TAG_BOX_LABELS[box]}
              tags={tagState[box].value}
              onAdd={(t) => addTag(box, t)}
              onRemove={(t) => removeTag(box, t)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-auto flex items-center justify-end gap-3 border-t border-border bg-surface px-6 py-3">
        <Button variant="ghost" asChild>
          <Link href={backHref}>Cancelar</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          <Save className="mr-1.5 size-4" />
          {mode === 'create' ? 'Crear plantilla' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
