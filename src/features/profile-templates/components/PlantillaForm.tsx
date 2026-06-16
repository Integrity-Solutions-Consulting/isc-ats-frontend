'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Label } from '@/design-system/ui/label';
import { TagInput } from '@/design-system/molecules/TagInput';
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

function TagsBox({ label, tags, onChange }: {
  label: string; tags: string[]; onChange: (tags: string[]) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <TagInput
        className="mt-1.5"
        value={tags}
        onChange={onChange}
        placeholder="Agregar y presionar Enter…"
      />
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

      <section className="rounded-lg border border-border bg-surface-2 p-5 shadow-sm">
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
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1"
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface-2 p-5 shadow-sm">
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
              onChange={tagState[box].set}
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
