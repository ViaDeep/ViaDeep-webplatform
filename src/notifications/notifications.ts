import type { ApiNotification } from '@/api/notification-api';
import { reportCode, TYPE_LABELS } from '@/domain/incident';

export type OperatorNotification = {
  id: string;
  incidentId: string;
  code: string;
  at: string;
  title: string;
  tag: string;
  tone: 'warning' | 'danger';
  /** Texto antes del distrito, por ejemplo "Bache en". */
  message: string;
  highlight: string;
  duplicates: number;
  read: boolean;
};

/** Convierte un aviso de nuevo reporte del servicio de notificaciones en la fila de la pantalla 9 de Figma. */
export function toOperatorNotification(notification: ApiNotification): OperatorNotification {
  const duplicates = notification.possibleDuplicates;
  return {
    id: notification.id,
    incidentId: notification.incidentId,
    code: reportCode(notification.incidentId, notification.reportedAt),
    at: notification.createdAt,
    title: notification.title,
    tag: duplicates > 0 ? (duplicates === 1 ? 'Posible duplicado' : `${duplicates} posibles duplicados`) : 'Nuevo reporte',
    tone: duplicates > 0 ? 'danger' : 'warning',
    message: `${TYPE_LABELS[notification.incidentType] ?? 'Incidencia vial'} en`,
    highlight: notification.district ?? 'Lima Metropolitana',
    duplicates,
    read: notification.read,
  };
}
