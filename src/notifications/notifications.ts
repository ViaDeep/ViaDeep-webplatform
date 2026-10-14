import { DISPLAY_STATUS_LABELS, displayStatus, reportCode, type IncidentSummary } from '@/domain/incident';

export type NotificationKind = 'NEW_REPORT' | 'ASSIGNED' | 'UPDATED';

export type OperatorNotification = {
  id: string;
  kind: NotificationKind;
  incidentId: string;
  code: string;
  at: string;
  title: string;
  tag: string;
  tone: 'warning' | 'danger' | 'info' | 'success' | 'muted';
  message: string;
  highlight: string | null;
};

/**
 * Todavía no existe el servicio de notificaciones: los avisos se arman con la actividad real de las incidencias
 * (registro, asignación y último cambio de estado o severidad), del más reciente al más antiguo.
 */
export function buildNotifications(incidents: IncidentSummary[]): OperatorNotification[] {
  const items: OperatorNotification[] = [];
  for (const incident of incidents) {
    const code = reportCode(incident.id, incident.createdAt);
    items.push({
      id: `${incident.id}:new`,
      kind: 'NEW_REPORT',
      incidentId: incident.id,
      code,
      at: incident.createdAt,
      title: 'Nuevo reporte registrado',
      tag: incident.severity === 'HIGH' ? 'Prioridad alta' : incident.aiValidated ? 'Detectado por IA' : 'Registro manual',
      tone: incident.severity === 'HIGH' ? 'danger' : 'warning',
      message: 'registrado en',
      highlight: incident.district ?? 'Lima Metropolitana',
    });
    if (incident.assignedAt && incident.assignee) {
      items.push({
        id: `${incident.id}:assigned:${incident.assignedAt}`,
        kind: 'ASSIGNED',
        incidentId: incident.id,
        code,
        at: incident.assignedAt,
        title: 'Incidencia asignada',
        tag: incident.assignedArea ?? 'Asignación',
        tone: 'info',
        message: 'fue asignada a',
        highlight: incident.assignee,
      });
    }
    const changed = new Date(incident.updatedAt).getTime() - new Date(incident.createdAt).getTime() > 1000;
    const onlyAssignment = incident.assignedAt !== null && incident.assignedAt === incident.updatedAt;
    if (changed && !onlyAssignment) {
      const status = displayStatus(incident.status, incident.severity);
      items.push({
        id: `${incident.id}:updated:${incident.updatedAt}`,
        kind: 'UPDATED',
        incidentId: incident.id,
        code,
        at: incident.updatedAt,
        title: 'Incidencia actualizada',
        tag: DISPLAY_STATUS_LABELS[status],
        tone: status === 'RESOLVED' ? 'success' : status === 'REJECTED' ? 'danger' : status === 'IN_PROGRESS' ? 'info' : 'warning',
        message: 'cambió a estado',
        highlight: DISPLAY_STATUS_LABELS[status],
      });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export type ReadState = { readAllAt: string; readIds: string[] };

/** La primera vez se consideran leídos los avisos de más de 7 días. */
export function initialReadState(now = new Date()): ReadState {
  return { readAllAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(), readIds: [] };
}

export function isUnread(notification: OperatorNotification, state: ReadState): boolean {
  return notification.at > state.readAllAt && !state.readIds.includes(notification.id);
}
