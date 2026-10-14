import { DISPLAY_STATUS_LABELS, displayStatus, reportCode, SEVERITY_LABELS, TYPE_LABELS, type IncidentSummary } from './incident';

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV (separado por comas, UTF-8 con BOM para que Excel respete las tildes). */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

export function incidentsCsv(incidents: IncidentSummary[]): string {
  return toCsv([
    ['Código', 'Fecha', 'Tipo', 'Severidad', 'Estado', 'Distrito', 'Latitud', 'Longitud', 'Responsable', 'Área', 'Validado por IA'],
    ...incidents.map((incident) => [
      reportCode(incident.id, incident.createdAt),
      new Date(incident.createdAt).toLocaleString('es-PE'),
      TYPE_LABELS[incident.type],
      incident.severity ? SEVERITY_LABELS[incident.severity] : 'Sin evaluar',
      DISPLAY_STATUS_LABELS[displayStatus(incident.status, incident.severity)],
      incident.district,
      incident.latitude,
      incident.longitude,
      incident.assignee,
      incident.assignedArea,
      incident.aiValidated ? 'Sí' : 'No',
    ]),
  ]);
}

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
