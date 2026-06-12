'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { cn } from '@/shared/utils';
import { step2Schema, type Step2Values, type Step2FormValues } from './schemas';
import { EDUCATION_OPTIONS, CAREERS, CITIES, PROVINCE_OPTIONS } from './constants';
import { FieldError } from './FieldError';

interface UniversityOption {
  id: number;
  code: string;
  name: string;
}

function ToggleCards({ value, onChange, options, error }: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  options: [string, string];
  error?: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {([true, false] as const).map((v, i) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left',
              value === v
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-border bg-surface text-ink-muted hover:border-primary-300',
            )}
          >
            {options[i]}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

export function Step2Education({ defaultValues, onNext, onBack }: {
  defaultValues: Step2FormValues;
  onNext: (data: Step2Values) => void;
  onBack: () => void;
}) {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);

  useEffect(() => {
    fetch('/api/catalogs/registration')
      .then((r) => r.json())
      .then((data: { universities?: UniversityOption[] }) => {
        if (data.universities) setUniversities(data.universities);
      })
      .catch(() => {
        // Non-blocking — form still works without the catalog
      });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2FormValues, unknown, Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  });

  const isStudying = watch('isStudying');
  const isWorking = watch('isWorking');

  const handleIsStudying = (v: boolean) => setValue('isStudying', v, { shouldValidate: true });
  const handleIsWorking = (v: boolean) => setValue('isWorking', v, { shouldValidate: true });

  const onSubmit = handleSubmit(onNext);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s2-educationLevel">Último nivel de educación finalizado *</Label>
          <select
            id="s2-educationLevel"
            {...register('educationLevel')}
            className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona un nivel</option>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <FieldError message={errors.educationLevel?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s2-completedCareer">Carrera / Título obtenido</Label>
          <select
            id="s2-completedCareer"
            {...register('completedCareer')}
            className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona</option>
            {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s2-university">
          Universidad <span className="text-ink-subtle">(opcional)</span>
        </Label>
        <select
          id="s2-university"
          {...register('university')}
          className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecciona tu universidad</option>
          {universities.map((u) => (
            <option key={u.id} value={String(u.id)}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s2-city">Ciudad *</Label>
          <select
            id="s2-city"
            {...register('city')}
            className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError message={errors.city?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s2-province">Provincia *</Label>
          <select
            id="s2-province"
            {...register('province')}
            className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona</option>
            {PROVINCE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <FieldError message={errors.province?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>¿Estudias actualmente? *</Label>
        <ToggleCards
          value={isStudying ?? null}
          onChange={handleIsStudying}
          options={['Sí, actualmente', 'No por ahora']}
          error={errors.isStudying?.message}
        />
        {isStudying && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label htmlFor="s2-career">Carrera que estudias</Label>
            <select
              id="s2-career"
              {...register('career')}
              className="w-full h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecciona</option>
              {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>¿Trabajas actualmente? *</Label>
        <ToggleCards
          value={isWorking ?? null}
          onChange={handleIsWorking}
          options={['Sí, actualmente', 'No por ahora']}
          error={errors.isWorking?.message}
        />
        {isWorking && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label htmlFor="s2-currentCompany">
              Empresa donde trabajas <span className="text-ink-subtle">(opcional)</span>
            </Label>
            <Input
              id="s2-currentCompany"
              placeholder="Nombre de la empresa"
              {...register('currentCompany')}
            />
            <p className="text-xs text-ink-subtle">Esta información es confidencial.</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="w-2/5" onClick={onBack}>← Atrás</Button>
        <Button type="submit" className="w-3/5">Continuar →</Button>
      </div>
    </form>
  );
}
