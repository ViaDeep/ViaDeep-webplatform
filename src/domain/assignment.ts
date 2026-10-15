/** Áreas de la MML a las que se deriva una incidencia (lista editable cuando exista un catálogo en el backend). */
export const MUNICIPAL_AREAS = [
  'Subgerencia de Mantenimiento Vial',
  'Gerencia de Movilidad Urbana',
  'Subgerencia de Operaciones Viales',
  'Subgerencia de Fiscalización',
  'Gerencia de Desarrollo Urbano',
  'Empresa Municipal Administradora de Peaje (EMAPE)',
] as const;

/**
 * Nombres que se ofrecen como responsable: los operadores activos en orden alfabético. Si la incidencia ya tenía un
 * responsable que no está en la lista (una asignación antigua escrita a mano o un operador desactivado), se mantiene
 * al inicio para no perderlo al guardar otros cambios.
 */
export function assigneeOptions(operators: { fullName: string }[], current: string | null): string[] {
  const names = [...new Set(operators.map((operator) => operator.fullName.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const kept = current?.trim();
  return kept && !names.includes(kept) ? [kept, ...names] : names;
}
