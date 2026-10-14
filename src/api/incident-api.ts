import type { IncidentDetail, IncidentStatus, IncidentSummary, IncidentType, Page, Severity, Statistics } from '@/domain/incident';

import { http } from './http';

export type IncidentFilters = {
  status?: IncidentStatus;
  type?: IncidentType;
  severity?: Severity;
  district?: string;
  page?: number;
  size?: number;
};

export const incidentApi = {
  async search(filters: IncidentFilters): Promise<Page<IncidentSummary>> {
    const { data } = await http.get<Page<IncidentSummary>>('/incidents', { params: filters });
    return data;
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

  async statistics(): Promise<Statistics> {
    const { data } = await http.get<Statistics>('/incidents/stats');
    return data;
  },
};

export const evidenceApi = {
  async signedUrl(evidenceId: string): Promise<string> {
    const { data } = await http.get<{ url: string }>(`/evidences/${evidenceId}/url`);
    return data.url;
  },
};
