export type IncidentType = 'D00' | 'D10' | 'D20' | 'D40';
export type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export const INCIDENT_TYPES: readonly IncidentType[] = ['D00', 'D10', 'D20', 'D40'];
export const STATUSES: readonly IncidentStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
export const SEVERITIES: readonly Severity[] = ['LOW', 'MEDIUM', 'HIGH'];

export const TYPE_LABELS: Record<IncidentType, string> = {
  D00: 'Grieta longitudinal',
  D10: 'Grieta transversal',
  D20: 'Piel de cocodrilo',
  D40: 'Bache',
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En atención',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado',
};

export const SEVERITY_LABELS: Record<Severity, string> = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };

export type AiResult = { confidence: number; bboxX: number; bboxY: number; bboxWidth: number; bboxHeight: number };

export type IncidentSummary = {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity | null;
  latitude: number;
  longitude: number;
  district: string | null;
  aiValidated: boolean;
  createdAt: string;
};

export type HistoryEntry = {
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  changedBy: string;
  comment: string | null;
  changedAt: string;
};

export type IncidentDetail = IncidentSummary & {
  reporterId: string;
  evidenceId: string;
  description: string | null;
  aiResult: AiResult | null;
  updatedAt: string;
  history: HistoryEntry[];
  possibleDuplicates: string[];
};

export type Page<T> = { items: T[]; page: number; size: number; totalItems: number };

export type Statistics = {
  total: number;
  byStatus: Partial<Record<IncidentStatus, number>>;
  byType: Partial<Record<IncidentType, number>>;
  byDistrict: Record<string, number>;
};

/** Transiciones que acepta el backend (IncidentStatus.canTransitionTo). */
export function nextStatuses(status: IncidentStatus): IncidentStatus[] {
  switch (status) {
    case 'PENDING':
      return ['IN_PROGRESS', 'REJECTED'];
    case 'IN_PROGRESS':
      return ['RESOLVED'];
    default:
      return [];
  }
}

/** Mismo código legible que muestra la app del ciudadano (REP-2026-LM-04821). */
export function reportCode(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const value = Number.parseInt(id.replace(/-/g, '').slice(0, 8), 16);
  const number = Number.isNaN(value) ? 0 : value % 100000;
  return `REP-${year}-LM-${String(number).padStart(5, '0')}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}
