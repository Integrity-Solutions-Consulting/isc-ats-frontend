'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { Select } from '@/design-system/atoms/Select';
import { cn } from '@/shared/utils';
import { step2Schema, type Step2Values, type Step2FormValues } from './schemas';
import { FieldError } from './FieldError';
import type { CvPrefillData } from './Step0CvUpload';

interface CatalogOption {
  id: number;
  code: string;
  name: string;
}

interface Catalogs {
  cities: CatalogOption[];
  provinces: CatalogOption[];
  educationLevels: CatalogOption[];
  careers: CatalogOption[];
  universities: CatalogOption[];
}

const EMPTY_CATALOGS: Catalogs = {
  cities: [],
  provinces: [],
  educationLevels: [],
  careers: [],
  universities: [],
};

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

export function Step2Education({ defaultValues, onNext, onBack, prefill, isSubmitting }: {
  defaultValues: Step2FormValues;
  onNext: (data: Step2Values) => void;
  onBack: () => void;
  prefill?: CvPrefillData;
  isSubmitting?: boolean;
}) {
  const [catalogs, setCatalogs] = useState<Catalogs>(EMPTY_CATALOGS);

  useEffect(() => {
    fetch('/api/catalogs/registration')
      .then((r) => r.json())
      .then((data: Partial<Catalogs>) => {
        setCatalogs({
          cities: data.cities ?? [],
          provinces: data.provinces ?? [],
          educationLevels: data.educationLevels ?? [],
          careers: data.careers ?? [],
          universities: data.universities ?? [],
        });
      })
      .catch(() => {
        // Non-blocking — form still renders, selects stay empty until retried
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
    defaultValues: {
      educationLevel: defaultValues.educationLevel || (prefill?.educationLevelId ? String(prefill.educationLevelId) : ''),
      completedCareer: defaultValues.completedCareer || (prefill?.careerId ? String(prefill.careerId) : ''),
      university: defaultValues.university || (prefill?.universityId ? String(prefill.universityId) : ''),
      city: defaultValues.city || (prefill?.cityId ? String(prefill.cityId) : ''),
      province: defaultValues.province || (prefill?.provinceId ? String(prefill.provinceId) : ''),
      isStudying: defaultValues.isStudying,
      career: defaultValues.career,
      isWorking: defaultValues.isWorking,
      currentCompany: defaultValues.currentCompany || prefill?.currentCompany || '',
    },
  });

  const isStudying = watch('isStudying');
  const isWorking = watch('isWorking');

  const handleIsStudying = (v: boolean) => setValue('isStudying', v, { shouldValidate: true });
  const handleIsWorking = (v: boolean) => setValue('isWorking', v, { shouldValidate: true });

  const onSubmit = handleSubmit(onNext);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s2-educationLevel">Último nivel de educación finalizado *</Label>
          <Select id="s2-educationLevel" {...register('educationLevel')}>
            <option value="">Selecciona un nivel</option>
            {catalogs.educationLevels.map((o) => (
              <option key={o.id} value={String(o.id)}>{o.name}</option>
            ))}
          </Select>
          <FieldError message={errors.educationLevel?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s2-completedCareer">Carrera / Título obtenido</Label>
          <Select id="s2-completedCareer" {...register('completedCareer')}>
            <option value="">Selecciona</option>
            {catalogs.careers.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s2-university">
          Universidad <span className="text-ink-subtle">(opcional)</span>
        </Label>
        <Select id="s2-university" {...register('university')}>
          <option value="">Selecciona tu universidad</option>
          {catalogs.universities.map((u) => (
            <option key={u.id} value={String(u.id)}>{u.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s2-city">Ciudad *</Label>
          <Select id="s2-city" {...register('city')}>
            <option value="">Selecciona</option>
            {catalogs.cities.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Select>
          <FieldError message={errors.city?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s2-province">Provincia *</Label>
          <Select id="s2-province" {...register('province')}>
            <option value="">Selecciona</option>
            {catalogs.provinces.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </Select>
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
            <Select id="s2-career" {...register('career')}>
              <option value="">Selecciona</option>
              {catalogs.careers.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </Select>
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
        <Button type="button" variant="outline" className="w-2/5" onClick={onBack} disabled={isSubmitting}>
          ← Atrás
        </Button>
        <Button type="submit" className="w-3/5 flex items-center justify-center gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? 'Guardando...' : 'Finalizar registro →'}
        </Button>
      </div>
    </form>
  );
}
