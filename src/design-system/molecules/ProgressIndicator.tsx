import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ProgressIndicatorProps {
  steps: string[];
  current: number;
}

export function ProgressIndicator({ steps, current }: ProgressIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
              i < current ? 'bg-primary-600 text-white' :
              i === current ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
              'bg-surface-2 text-ink-muted',
            )}>
              {i < current ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              i === current ? 'text-primary-600 font-medium' : 'text-ink-subtle',
            )}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        ))}
      </div>
      <div className="relative h-1 rounded-full bg-surface-2">
        <div
          className="absolute h-1 rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
