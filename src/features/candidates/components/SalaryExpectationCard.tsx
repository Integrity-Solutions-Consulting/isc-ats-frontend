import { parseISO } from 'date-fns';
import { Wallet } from 'lucide-react';

interface SalaryExpectationCardProps {
  /** null = the candidate never declared an amount on this application. */
  salaryExpectation: number | null;
  /** ISO datetime the application was submitted. */
  appliedAt: string;
}

function formatAppliedAt(isoDatetime: string): string | null {
  const date = parseISO(isoDatetime);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * What the candidate asked for on THIS application.
 *
 * Deliberately its own card rather than a row inside "Datos personales": that
 * card holds candidate-scoped facts, the same no matter which vacancy is open,
 * while a salary expectation belongs to one application — the same person can
 * ask for a different amount elsewhere. Keeping it separate stops the profile
 * from implying the figure follows the candidate around.
 */
export function SalaryExpectationCard({
  salaryExpectation,
  appliedAt,
}: SalaryExpectationCardProps) {
  const isDeclared = salaryExpectation !== null;
  const applied = formatAppliedAt(appliedAt);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-ink-muted">
        <Wallet className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-ink-subtle">Aspiración salarial</p>
        {isDeclared ? (
          <p className="text-xl font-semibold text-ink">
            {salaryExpectation.toLocaleString('es-EC', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : (
          // An undeclared amount is unknown, not zero. Rendering "$0" here would
          // state on screen that the candidate asked for nothing.
          <p className="text-xl font-semibold text-ink-subtle">No declarado</p>
        )}
      </div>

      {/* The amount is fixed at submission — it is not editable afterwards — so
          this date is exactly when the figure above was declared. */}
      {applied && (
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">Postuló el</p>
          <p className="text-sm font-medium text-ink">{applied}</p>
        </div>
      )}
    </div>
  );
}
