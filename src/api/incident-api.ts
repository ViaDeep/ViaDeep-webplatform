import type { IncidentDetail, IncidentStatus, IncidentSummary, IncidentType, Page, Severity, Statistics } from '@/domain/incident';

import { http } from './http';

export type IncidentFilters = {
  status?: IncidentStatus;
  type?: IncidentType;
  severity?: Severity;
  district?: string;
  assigned?: boolean;
  /** Fechas YYYY-MM-DD (hora de Lima), ambas incluidas. */
  from?: string;
  to?: string;
  sort?: 'createdAt' | 'updatedAt';
  page?: number;
  size?: number;
};

export type Assignment = { assignee: string; area: string; note?: string };

/** Tamaño máximo de página que acepta el backend. */
export const MAX_PAGE_SIZE = 100;

export const incidentApi = {
  async search(filters: IncidentFilters): Promise<Page<IncidentSummary>> {
    const { data } = await http.get<Page<IncidentSummary>>('/incidents', { params: filters });
    return data;
  },

  /** Recorre las páginas hasta `limit` incidencias (para el mapa y la exportación). */
  async searchAll(filters: IncidentFilters, limit = 1000): Promise<{ items: IncidentSummary[]; totalItems: number }> {
    const items: IncidentSummary[] = [];
    let page = 0;
    let totalItems = 0;
    do {
      const result = await incidentApi.search({ ...filters, page, size: MAX_PAGE_SIZE });
      items.push(...result.items);
      totalItems = result.totalItems;
      page += 1;
      if (result.items.length < MAX_PAGE_SIZE) break;
    } while (items.length < Math.min(totalItems, limit));
    return { items: items.slice(0, limit), totalItems };
  },

  async detail(id: string): Promise<IncidentDetail> {
    const { data } = await http.get<IncidentDetail>(`/incidents/${id}`);
    return data;
  },

  async changeStatus(id: string, status: IncidentStatus, comment?: string): Promise<void> {
    await http.patch(`/incidents/${id}/status`, { status, comment: comment?.trim() || undefined });
  },

  async assignSeverity(id: string, severity: Severity): Promise<void> {
    await http.patch(`/incidents/${id}/severity`, { severity });
  },

  async assign(id: string, assignment: Assignment): Promise<void> {
    await http.patch(`/incidents/${id}/assignment`, {
      assignee: assignment.assignee.trim(),
      area: assignment.area.trim(),
      note: assignment.note?.trim() || undefined,
    });
  },

  async statistics(range?: { from: string; to: string }): Promise<Statistics> {
    const { data } = await http.get<Statistics>('/incidents/stats', { params: range });
    return data;
  },
};

export const evidenceApi = {
  async signedUrl(evidenceId: string): Promise<string> {
    const { data } = await http.get<{ url: string }>(`/evidences/${evidenceId}/url`);
    return data.url;
  },
};
