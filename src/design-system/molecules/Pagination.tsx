import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/design-system/ui/button';

export interface PaginationProps {
  /** 0-based current page index */
  page: number;
  /** Total number of pages */
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  /** Optional CSS class override on the wrapper */
  className?: string;
}

/**
 * Presentational pagination row.
 * Renders "Página X de Y" with chevron buttons disabled at bounds.
 * Only renders the button group when pageCount > 1.
 */
export function Pagination({
  page,
  pageCount,
  onPrev,
  onNext,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-ink-muted">
          Página {page + 1} de {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página siguiente"
          disabled={page >= pageCount - 1}
          onClick={onNext}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
