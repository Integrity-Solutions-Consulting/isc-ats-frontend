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
