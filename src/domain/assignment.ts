/** Áreas de la MML a las que se deriva una incidencia (lista editable cuando exista un catálogo en el backend). */
export const MUNICIPAL_AREAS = [
  'Subgerencia de Mantenimiento Vial',
  'Gerencia de Movilidad Urbana',
  'Subgerencia de Operaciones Viales',
  'Subgerencia de Fiscalización',
  'Gerencia de Desarrollo Urbano',
  'Empresa Municipal Administradora de Peaje (EMAPE)',
] as const;

/** Responsables ya usados en otras asignaciones, sin repetir y en orden alfabético (para sugerirlos). */
export function knownAssignees(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}
