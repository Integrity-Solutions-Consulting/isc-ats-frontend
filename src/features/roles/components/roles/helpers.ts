import { type ModuleGroup, moduleCodes } from './permissions';

/** Whether a role has all / some / none of a module's permissions granted. */
export function moduleGranted(
  granted: Set<string>,
  mod: ModuleGroup,
): 'all' | 'partial' | 'none' {
  const codes = moduleCodes(mod);
  if (codes.length === 0) return 'none';
  const on = codes.filter((code) => granted.has(code)).length;
  if (on === 0) return 'none';
  if (on === codes.length) return 'all';
  return 'partial';
}

/** Percentage of the catalog a role has granted (0–100). */
export function permFraction(grantedCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((grantedCount / total) * 100);
}
