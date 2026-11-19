import { describe, expect, it } from 'vitest';

import { incidentDetections, nextStatuses, reportCode, type IncidentDetail } from '../incident';

describe('incidencias', () => {
  it('ofrece solo las transiciones que acepta el backend', () => {
    expect(nextStatuses('PENDING')).toEqual(['IN_PROGRESS', 'REJECTED']);
    expect(nextStatuses('IN_PROGRESS')).toEqual(['RESOLVED']);
    expect(nextStatuses('RESOLVED')).toEqual([]);
    expect(nextStatuses('REJECTED')).toEqual([]);
  });

  it('genera el mismo código que la app móvil', () => {
    expect(reportCode('0001e1f5-aaaa-bbbb-cccc-000000000001', '2026-10-14T10:00:00Z')).toBe('REP-2026-LM-23381');
  });

  it('separa los daños del reporte de los que no alcanzaron el umbral', () => {
    const box = { bboxX: 0, bboxY: 0, bboxWidth: 0.5, bboxHeight: 0.5 };
    const incident = {
      type: 'D20',
      aiResult: { confidence: 0.95, ...box },
      detections: [
        { type: 'D00', confidence: 0.42, accepted: false, ...box },
        { type: 'D40', confidence: 0.81, accepted: true, ...box },
        { type: 'D20', confidence: 0.95, accepted: true, ...box },
      ],
    } as IncidentDetail;
    const { accepted, below } = incidentDetections(incident);
    expect(accepted.map((d) => d.type)).toEqual(['D20', 'D40']);
    expect(below.map((d) => d.type)).toEqual(['D00']);
  });

  it('un reporte antiguo tiene como única detección la principal', () => {
    const incident = { type: 'D40', aiResult: { confidence: 0.9, bboxX: 0, bboxY: 0, bboxWidth: 1, bboxHeight: 1 } } as IncidentDetail;
    expect(incidentDetections(incident).accepted).toEqual([{ ...incident.aiResult, type: 'D40', accepted: true }]);
    expect(incidentDetections({ ...incident, aiResult: null }).accepted).toEqual([]);
  });
});
