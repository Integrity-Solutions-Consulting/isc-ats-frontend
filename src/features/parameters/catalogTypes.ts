// Shared {key, label} pairs for the 13 catalog parameter types. This is the
// minimal subset of `CATALOG_TYPES` (see CatalogosPage.tsx) that other
// features need — e.g. the Roles screen's writable-catalog-types multi-select
// — without duplicating (and risking drift from) the richer, page-specific
// array that also carries endpoint/hasDescription/hiddenCodes.
export const CATALOG_TYPE_LABELS: { key: string; label: string }[] = [
  { key: 'department', label: 'Departamentos' },
  { key: 'stage', label: 'Etapas de proceso' },
  { key: 'stage_status', label: 'Sub-estados de etapa' },
  { key: 'city', label: 'Ciudades' },
  { key: 'career', label: 'Carreras' },
  { key: 'title', label: 'Títulos' },
  { key: 'education_level', label: 'Niveles de educación' },
  { key: 'work_mode', label: 'Modalidades' },
  { key: 'resource_level', label: 'Niveles de recurso' },
  { key: 'vacancy_name', label: 'Plantillas de nombre' },
];
