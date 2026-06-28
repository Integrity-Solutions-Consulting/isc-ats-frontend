'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/design-system/ui/button';
import { Label } from '@/design-system/ui/label';
import { Input } from '@/design-system/ui/input';
import { cn } from '@/shared/utils';
import { step1Schema, type Step1Values } from './schemas';
import { FieldError } from './FieldError';
import type { CvPrefillData } from './Step0CvUpload';

export function Step1PersonalData({ defaultValues, onNext, prefill }: {
  defaultValues: Step1Values;
  onNext: (data: Step1Values) => void;
  prefill?: CvPrefillData;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: 'onTouched',
    defaultValues: {
      docType: defaultValues.docType ?? 'cedula',
      firstName: defaultValues.firstName || prefill?.firstName || '',
      lastName: defaultValues.lastName || prefill?.lastName || '',
      idNumber: defaultValues.idNumber || prefill?.idNumber || '',
      birthDate: defaultValues.birthDate || prefill?.birthDate || '',
      phone: defaultValues.phone || prefill?.phone || '',
      homeAddress: defaultValues.homeAddress || prefill?.homeAddress || '',
    },
  });

  const docType = watch('docType');

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s1-firstName">Nombres *</Label>
          <Input id="s1-firstName" placeholder="Ingresa tus nombres" {...register('firstName')} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-lastName">Apellidos *</Label>
          <Input id="s1-lastName" placeholder="Ingresa tus apellidos" {...register('lastName')} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de documento *</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['cedula', 'passport'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setValue('docType', type, { shouldValidate: true });
                setValue('idNumber', '', { shouldValidate: false });
              }}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                docType === type
                  ? 'border-primary-600 bg-primary-700 text-white'
                  : 'border-border bg-surface text-ink-muted hover:border-primary-300',
              )}
            >
              {type === 'cedula' ? 'Cédula' : 'Pasaporte'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s1-idNumber">
            {docType === 'cedula' ? 'Cédula de identidad *' : 'Número de pasaporte *'}
          </Label>
          <Input
            id="s1-idNumber"
            placeholder={docType === 'cedula' ? '1234567890' : 'AB1234567'}
            {...register('idNumber')}
          />
          <FieldError message={errors.idNumber?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-birthDate">Fecha de nacimiento</Label>
          <Input id="s1-birthDate" type="date" {...register('birthDate')} />
          <FieldError message={errors.birthDate?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s1-phone">Número de celular *</Label>
        <Input
          id="s1-phone"
          type="tel"
          inputMode="tel"
          placeholder="0991234567 o +12025551234"
          {...register('phone')}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s1-homeAddress">Dirección domiciliaria</Label>
        <Input
          id="s1-homeAddress"
          placeholder="Av. Amazonas N12-34, Quito"
          {...register('homeAddress')}
        />
      </div>

      <Button type="submit" className="w-full">Continuar →</Button>
      <p className="text-center text-xs text-ink-subtle">
        Tu información está protegida bajo nuestra política de privacidad
      </p>
    </form>
  );
}
