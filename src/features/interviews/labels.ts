import type { BadgeProps } from '@/design-system/ui/badge';
import type { InterviewStatus } from './types';

export const STATUS_LABEL: Record<InterviewStatus, string> = {
  scheduled: 'Agendada',
  offered: 'Ofrecida',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

export const STATUS_BADGE_VARIANT: Record<InterviewStatus, NonNullable<BadgeProps['variant']>> = {
  scheduled: 'info',
  offered: 'neutral',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'default',
};

// Ecuador is a fixed UTC-5 (no DST) — always render the scheduled date/time in
// Ecuador wall-clock time, regardless of the viewer's browser timezone. Same
// approach as the dashboard's agenda widget (EC_TIME_FMT in buildDashboardData).
const EC_DATETIME_FMT = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatInterviewDateTime(scheduledAt: string): string {
  return EC_DATETIME_FMT.format(new Date(scheduledAt));
}

/**
 * Whether an interview's scheduled start is already in the past.
 *
 * This compares two absolute instants (the current instant vs. the parsed ISO
 * instant), not a calendar-day boundary — so it is safe to compute in the
 * browser regardless of the viewer's local timezone. It would NOT be safe to
 * derive a "today/tomorrow" bucket this way (that depends on which timezone's
 * midnight you mean), which is why that kind of boundary is computed
 * server-side in Ecuador time instead (see /recruitment/interviews/agenda).
 */
export function isPastInterview(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() < Date.now();
}
