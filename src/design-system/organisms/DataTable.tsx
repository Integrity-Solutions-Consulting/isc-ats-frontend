import type { KeyboardEvent, ReactNode } from 'react';

import { EmptyState } from '@/design-system/molecules/EmptyState';
import { cn } from '@/shared/utils';

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef<TRow> {
  /** Column header label */
  header: string;
  /** Unique key — used as React key and for optional accessorKey rendering */
  key: string;
  /** Cell renderer. Receives the full row object. */
  render: (row: TRow) => ReactNode;
  /** Horizontal alignment for both <th> and <td>. Default: 'left'. */
  align?: 'left' | 'right' | 'center';
  /** Optional width hint, e.g. "w-10" or "w-48". Passed to th/td. */
  width?: string;
}

// ─── Component props ──────────────────────────────────────────────────────────

export interface DataTableProps<TRow> {
  columns: ColumnDef<TRow>[];
  data: TRow[];
  /** Unique identifier for each row. Used as the React key. */
  rowKey: (row: TRow) => string | number;
  /**
   * If provided, each row is clickable and keyboard-accessible.
   * Rows get role="button", tabIndex=0, and respond to Enter/Space.
   */
  onRowClick?: (row: TRow) => void;
  /**
   * When true, renders a skeleton shimmer instead of rows.
   * Uses `skeletonRows` (default 4) and `columns.length` to size it.
   */
  isLoading?: boolean;
  skeletonRows?: number;
  /** Props forwarded to <EmptyState> when data is empty and not loading. */
  emptyState?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };
  className?: string;
}

// ─── Alignment helpers ────────────────────────────────────────────────────────

const ALIGN_TH: Record<NonNullable<ColumnDef<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const ALIGN_TD: Record<NonNullable<ColumnDef<unknown>['align']>, string> = {
  left: '',
  right: 'text-right',
  center: 'text-center',
};

// ─── DataTable ────────────────────────────────────────────────────────────────

/**
 * Presentational data table organism.
 *
 * - Pure props: no fetching, no business logic.
 * - Generic over TRow — no `any`.
 * - Keyboard-accessible clickable rows (role="button", Enter/Space).
 * - Renders <EmptyState> when data is empty and not loading.
 * - Wraps in overflow-x-auto for responsive horizontal scroll.
 *
 * Place in design-system/organisms/ because it composes multiple atoms/molecules
 * (thead, tbody, EmptyState) into a complete standalone UI unit.
 */
export function DataTable<TRow>({
  columns,
  data,
  rowKey,
  onRowClick,
  isLoading = false,
  skeletonRows = 4,
  emptyState = { title: 'Sin resultados' },
  className,
}: DataTableProps<TRow>) {
  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: TRow) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-semibold text-ink-muted',
                    ALIGN_TH[col.align ?? 'left'],
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-surface-2" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                    className="rounded-none border-0 shadow-none"
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-border last:border-0',
                    onRowClick &&
                      'cursor-pointer hover:bg-primary-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300',
                  )}
                  {...(onRowClick
                    ? {
                        role: 'button' as const,
                        tabIndex: 0,
                        onClick: () => onRowClick(row),
                        onKeyDown: (e) => handleRowKeyDown(e, row),
                      }
                    : {})}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-ink', ALIGN_TD[col.align ?? 'left'], col.width)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
