import type { DashboardData } from '../types';

export async function getDashboardData(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Error al cargar datos del dashboard');
  }
  return res.json() as Promise<DashboardData>;
}
