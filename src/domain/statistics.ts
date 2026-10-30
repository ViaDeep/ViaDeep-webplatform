import type { IncidentStatus, IncidentSummary, Statistics } from './incident';

/** Mismas cifras que GET /incidents/stats, calculadas sobre una lista ya filtrada. */
export function aggregate(incidents: IncidentSummary[]): Statistics {
  const stats: Statistics = { total: incidents.length, byStatus: {}, byType: {}, byDistrict: {}, bySeverity: {}, assigned: 0 };
  for (const incident of incidents) {
    stats.byStatus[incident.status] = (stats.byStatus[incident.status] ?? 0) + 1;
    stats.byType[incident.type] = (stats.byType[incident.type] ?? 0) + 1;
    const district = incident.district ?? 'Sin distrito';
    stats.byDistrict[district] = (stats.byDistrict[district] ?? 0) + 1;
    if (incident.severity) stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] ?? 0) + 1;
    if (incident.assignee) stats.assigned += 1;
  }
  return stats;
}

export function statusCount(stats: Statistics, status: IncidentStatus): number {
  return stats.byStatus[status] ?? 0;
}

/** Variación porcentual frente al periodo anterior, o null si antes no hubo registros. */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Distritos ordenados de mayor a menor cantidad de incidencias. */
export function topDistricts(stats: Statistics, limit = 10): [string, number][] {
  return Object.entries(stats.byDistrict)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, limit);
}
