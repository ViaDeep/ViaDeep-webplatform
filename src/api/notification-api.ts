import type { IncidentType, Page } from '@/domain/incident';

import { http } from './http';

/** Aviso tal como lo devuelve el servicio de notificaciones (para un operador: nuevos reportes). */
export type ApiNotification = {
  id: string;
  type: 'NEW_REPORT' | 'STATUS_CHANGED' | 'REJECTED';
  incidentId: string;
  incidentType: IncidentType;
  district: string | null;
  incidentStatus: string;
  possibleDuplicates: number;
  comment: string | null;
  reportedAt: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export const notificationApi = {
  async list(params: { unread?: boolean; page?: number; size?: number } = {}): Promise<Page<ApiNotification>> {
    const { data } = await http.get<Page<ApiNotification>>('/notifications', { params });
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await http.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  async markRead(id: string): Promise<void> {
    await http.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await http.patch('/notifications/read-all');
  },
};
