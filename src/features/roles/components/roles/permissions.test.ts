import { describe, it, expect } from 'vitest';
import {
  buildPermissionTree,
  moduleCodes,
  countPermissions,
  type CatalogPermission,
} from './permissions';

const cat = (id: number, code: string): CatalogPermission => ({
  id,
  code,
  name: code,
  module: code.split('.')[0],
});

const sample: CatalogPermission[] = [
  cat(1, 'recruitment.vacancies.read'),
  cat(2, 'recruitment.vacancies.delete'),
  cat(3, 'recruitment.vacancies.create'),
  cat(4, 'org.departments.read'),
  cat(5, 'auth.roles.update'),
];

describe('buildPermissionTree', () => {
  it('groups by module then resource with Spanish labels', () => {
    const tree = buildPermissionTree(sample);
    const recruitment = tree.find((m) => m.key === 'recruitment');
    expect(recruitment?.label).toBe('Reclutamiento');
    const vacancies = recruitment?.resources.find((r) => r.key === 'vacancies');
    expect(vacancies?.label).toBe('Vacantes');
    expect(vacancies?.permissions).toHaveLength(3);
  });

  it('orders actions read → create → update → delete', () => {
    const tree = buildPermissionTree(sample);
    const actions = tree
      .find((m) => m.key === 'recruitment')!
      .resources.find((r) => r.key === 'vacancies')!
      .permissions.map((p) => p.action);
    expect(actions).toEqual(['read', 'create', 'delete']);
  });

  it('orders modules by predefined precedence (recruitment before auth)', () => {
    const tree = buildPermissionTree(sample);
    const keys = tree.map((m) => m.key);
    expect(keys.indexOf('recruitment')).toBeLessThan(keys.indexOf('auth'));
  });

  it('flags dangerous actions (delete)', () => {
    const tree = buildPermissionTree(sample);
    const del = tree
      .find((m) => m.key === 'recruitment')!
      .resources.find((r) => r.key === 'vacancies')!
      .permissions.find((p) => p.action === 'delete');
    expect(del?.dangerous).toBe(true);
  });

  it('translates action labels to Spanish', () => {
    const tree = buildPermissionTree([cat(1, 'org.departments.read')]);
    expect(tree[0].resources[0].permissions[0].actionLabel).toBe('Ver');
  });

  it('falls back to a humanized label for unknown resources/modules', () => {
    const tree = buildPermissionTree([cat(1, 'custom.weird_thing.read')]);
    expect(tree[0].resources[0].label).toBe('Weird thing');
  });

  it('moduleCodes and countPermissions reflect the tree', () => {
    const tree = buildPermissionTree(sample);
    const recruitment = tree.find((m) => m.key === 'recruitment')!;
    expect(moduleCodes(recruitment)).toEqual([
      'recruitment.vacancies.read',
      'recruitment.vacancies.create',
      'recruitment.vacancies.delete',
    ]);
    expect(countPermissions(tree)).toBe(5);
  });
});
