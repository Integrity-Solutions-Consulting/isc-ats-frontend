'use client';

import { useLayoutEffect } from 'react';

import { useBreadcrumbStore } from '@/shared/stores/breadcrumbStore';

// useLayoutEffect fires synchronously before paint, avoiding the "…" flash.
// No cleanup: letting the name linger is better than flashing null between pages.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : () => {};

export function VacancyBreadcrumbSetter({ name }: { name: string }) {
  const setVacancyName = useBreadcrumbStore((s) => s.setVacancyName);

  useIsomorphicLayoutEffect(() => {
    setVacancyName(name);
  }, [name, setVacancyName]);

  return null;
}
