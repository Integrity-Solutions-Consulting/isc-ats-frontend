'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/design-system/ui/button';
import { Label } from '@/design-system/ui/label';
import { Input } from '@/design-system/ui/input';
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
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: defaultValues.firstName || prefill?.firstName || '',
      lastName: defaultValues.lastName || prefill?.lastName || '',
      idNumber: defaultValues.idNumber,
      birthDate: defaultValues.birthDate,
      phone: defaultValues.phone || prefill?.phone || '',
      homeAddress: defaultValues.homeAddress,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s1-firstName">Nombres *</Label>
          <Input id="s1-firstName" placeholder="Juan" {...register('firstName')} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-lastName">Apellidos *</Label>
          <Input id="s1-lastName" placeholder="Pérez" {...register('lastName')} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s1-idNumber">Cédula o pasaporte *</Label>
          <Input id="s1-idNumber" placeholder="1234567890" {...register('idNumber')} />
          <FieldError message={errors.idNumber?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-birthDate">Fecha de nacimiento *</Label>
          <Input id="s1-birthDate" type="date" {...register('birthDate')} />
          <FieldError message={errors.birthDate?.message} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s1-phone">Número de celular *</Label>
        <Input id="s1-phone" placeholder="0991234567" {...register('phone')} />
        <FieldError message={errors.phone?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s1-homeAddress">
          Dirección domiciliaria <span className="text-ink-subtle">(opcional)</span>
        </Label>
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
