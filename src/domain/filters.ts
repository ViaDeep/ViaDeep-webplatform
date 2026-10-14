import type { IncidentStatus } from './incident';

/** Etiquetas del filtro de estado: el backend agrupa registradas y en revisión como PENDING. */
export const STATUS_FILTER_LABELS: Record<IncidentStatus, string> = {
  PENDING: 'Registrada / En revisión',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
};

export const RANGES = [
  { value: '', label: 'Todo el historial' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
] as const;
