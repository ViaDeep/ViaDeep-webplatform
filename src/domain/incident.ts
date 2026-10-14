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
  updatedAt: string;
  assignee: string | null;
  assignedArea: string | null;
  assignedAt: string | null;
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
  assignmentNote: string | null;
  history: HistoryEntry[];
  possibleDuplicates: string[];
};

export type Page<T> = { items: T[]; page: number; size: number; totalItems: number };

export type Statistics = {
  total: number;
  byStatus: Partial<Record<IncidentStatus, number>>;
  byType: Partial<Record<IncidentType, number>>;
  byDistrict: Record<string, number>;
  bySeverity: Partial<Record<Severity, number>>;
  assigned: number;
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

/**
 * Estado como lo muestran los mockups (y la app del ciudadano). El backend no tiene "en revisión": es un reporte
 * pendiente al que un operador ya le asignó severidad.
 */
export type DisplayStatus = 'REGISTERED' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  REGISTERED: 'Registrada',
  IN_REVIEW: 'En revisión',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
};

export function displayStatus(status: IncidentStatus, severity: Severity | null): DisplayStatus {
  if (status === 'PENDING') return severity ? 'IN_REVIEW' : 'REGISTERED';
  return status;
}

/** Icono (Material Symbols) de cada clase de LMD-YOLO. */
export const TYPE_ICONS: Record<IncidentType, string> = {
  D00: 'show_chart',
  D10: 'horizontal_rule',
  D20: 'texture',
  D40: 'warning',
};

/** Fechas de inicio y fin (YYYY-MM-DD, hora de Lima) de los últimos `days` días, hoy incluido. */
export function lastDays(days: number, today = new Date()): { from: string; to: string } {
  const toIso = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { from: toIso(start), to: toIso(today) };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** "Hace 5 min", "Hoy, 09:15 a. m.", "Ayer, 16:40" o la fecha. */
export function relativeTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, now)) return `Hoy, ${formatTime(iso)}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return `Ayer, ${formatTime(iso)}`;
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function percent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

export function initials(name: string): string {
  const words = name.replace(/^(Ing|Lic|Dr|Dra|Arq|Bach|Tec)\.\s+/i, '').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join('') || '?';
}
