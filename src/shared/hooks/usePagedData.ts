'use client';

import { useMemo, useState } from 'react';

export interface PagedData<T> {
  /** Rows for the current page. */
  pageRows: T[];
  /** Clamped zero-based page index — safe to render directly. */
  page: number;
  pageCount: number;
  goPrev: () => void;
  goNext: () => void;
}

/**
 * Client-side pagination over an in-memory list.
 *
 * The page index is clamped instead of reset when the list shrinks
 * (e.g. parent filters reduce the data), so the user never lands on
 * an out-of-range page.
 */
export function usePagedData<T>(data: T[], pageSize: number): PagedData<T> {
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const page = Math.min(pageIndex, pageCount - 1);

  const pageRows = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize],
  );

  return {
    pageRows,
    page,
    pageCount,
    goPrev: () => setPageIndex(Math.max(0, page - 1)),
    goNext: () => setPageIndex(Math.min(pageCount - 1, page + 1)),
  };
}
