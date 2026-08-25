import { AlertTriangle } from 'lucide-react';
import { Input } from '@/design-system/ui/input';
import { cn } from '@/shared/utils';

// ─── Field label + value helpers ─────────────────────────────────────────────

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] text-ink-subtle uppercase mb-1">
      {children}
    </label>
  );
}

export function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-ink">{children}</p>;
}

export function FieldInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FieldNumberInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      id={id}
      type="number"
      step="0.5"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Incomplete-field notice ────────────────────────────────────────────────
// Same amber "parciales" visual language as PermissionModuleCard's partial-
// coverage badge (Roles y permisos), reused here to flag an unfilled field.

export function IncompleteNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[12px] font-medium text-warning">
      <AlertTriangle className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

// ─── Pill badge ─────────────────────────────────────────────────────────────

export function StatusPill({ active, labelYes, labelNo }: { active: boolean; labelYes: string; labelNo: string }) {
  return (
    <span className={cn(
      'inline-flex items-center h-6 px-2.5 text-[12px] font-medium rounded-full',
      active ? 'bg-warning/15 text-warning' : 'bg-surface-2 text-ink-muted',
    )}>
      {active ? labelYes : labelNo}
    </span>
  );
}
