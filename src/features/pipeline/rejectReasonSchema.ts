import { z } from 'zod';

// Free text HR writes when moving a candidate into the Rechazados column.
// Required — the backend rejects the PATCH with 400 when a move into the
// rejected stage carries no rejection_reason (RejectionReasonRequiredError).
export const rejectReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'El motivo del rechazo es obligatorio'),
});

export type RejectReasonValues = z.infer<typeof rejectReasonSchema>;
