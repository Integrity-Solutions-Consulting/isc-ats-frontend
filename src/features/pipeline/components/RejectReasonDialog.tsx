'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/design-system/ui/button';
import { Label } from '@/design-system/ui/label';
import { Textarea } from '@/design-system/ui/textarea';
import { FieldError } from '@/design-system/atoms/FieldError';
import { Modal } from '@/design-system/molecules/Modal';
import { rejectReasonSchema, type RejectReasonValues } from '../rejectReasonSchema';

const FORM_ID = 'reject-reason-form';

interface RejectReasonDialogProps {
  open: boolean;
  /** Name shown in the confirmation copy — omitted while the dialog is closing. */
  candidateName?: string;
  isSubmitting?: boolean;
  submitError?: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Prompts for a required rejection reason before a card is moved into the
 * Rechazados column. Built on the shared Modal (façade over ui/dialog) —
 * no parallel modal primitive. The card itself never moves until `onConfirm`
 * fires: the caller only invokes the move mutation from there, so cancelling
 * this dialog needs no drag/optimistic-state revert — nothing changed yet.
 */
export function RejectReasonDialog({
  open,
  candidateName,
  isSubmitting = false,
  submitError,
  onCancel,
  onConfirm,
}: RejectReasonDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectReasonValues>({
    resolver: zodResolver(rejectReasonSchema),
    mode: 'onTouched',
    defaultValues: { reason: '' },
  });

  // A previous candidate's reason must never bleed into the next rejection.
  useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  function onSubmit(values: RejectReasonValues) {
    onConfirm(values.reason.trim());
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        // Ignore Escape/backdrop/X-button dismissal while the reject request
        // is in flight — otherwise the dialog closes but onError/onSuccess
        // still land on unmounted UI, leaving the user unsure whether the
        // candidate was actually rejected.
        if (!next && !isSubmitting) onCancel();
      }}
      showClose={!isSubmitting}
      title="Rechazar candidato"
      description={
        candidateName
          ? `${candidateName} pasará a la columna Rechazados y recibirá este motivo por correo.`
          : 'El candidato recibirá este motivo por correo.'
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? 'Rechazando…' : 'Rechazar'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-1.5">
        <Label htmlFor="reject-reason">Motivo del rechazo *</Label>
        <Textarea
          id="reject-reason"
          placeholder="Explica brevemente por qué se rechaza a este candidato…"
          error={!!errors.reason}
          disabled={isSubmitting}
          {...register('reason')}
        />
        <FieldError message={errors.reason?.message} />
        {submitError && <p className="mt-2 text-sm text-danger">{submitError}</p>}
      </form>
    </Modal>
  );
}
