import { displayStatus, type IncidentSummary } from '@/domain/incident';

/** Centro de Lima Metropolitana. */
export const LIMA_CENTER: [number, number] = [-12.0897, -77.0282];

/** Simbología de los mockups: rojo alta severidad, naranja en revisión, azul en proceso, verde resuelta. */
export const MARKER_LEGEND = [
  { key: 'HIGH', label: 'Alta severidad', color: '#dc2626' },
  { key: 'REVIEW', label: 'Registrada / En revisión', color: '#f97316' },
  { key: 'PROGRESS', label: 'En proceso', color: '#0ea5e9' },
  { key: 'RESOLVED', label: 'Resuelta', color: '#009c6b' },
  { key: 'OTHER', label: 'Rechazada', color: '#8a94a6' },
] as const;

export function markerColor(incident: IncidentSummary): string {
  const status = displayStatus(incident.status, incident.severity);
  if (status === 'RESOLVED') return '#009c6b';
  if (status === 'REJECTED') return '#8a94a6';
  if (incident.severity === 'HIGH') return '#dc2626';
  if (status === 'IN_PROGRESS') return '#0ea5e9';
  return '#f97316';
}
