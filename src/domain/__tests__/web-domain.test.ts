import { describe, expect, it } from 'vitest';

import type { IncidentSummary } from '@/domain/incident';
import { assigneeOptions } from '@/domain/assignment';
import { aggregate, change, topDistricts } from '@/domain/statistics';
import type { ApiNotification } from '@/api/notification-api';
import { toOperatorNotification } from '@/notifications/notifications';
import { pageNumbers } from '@/ui/pagination';

function incident(overrides: Partial<IncidentSummary> = {}): IncidentSummary {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    type: 'D40',
    status: 'PENDING',
    severity: null,
    latitude: -12.05,
    longitude: -77.04,
    district: 'Miraflores',
    aiValidated: false,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
    assignee: null,
    assignedArea: null,
    assignedAt: null,
    ...overrides,
  };
}

describe('pageNumbers', () => {
  it('muestra todas las páginas cuando son pocas', () => {
    expect(pageNumbers(0, 3)).toEqual([0, 1, 2]);
  });

  it('pone huecos alrededor de la página actual', () => {
    expect(pageNumbers(5, 12)).toEqual([0, null, 4, 5, 6, null, 11]);
  });
});

describe('statistics', () => {
  it('agrega por estado, distrito, severidad y asignación', () => {
    const stats = aggregate([
      incident(),
      incident({ status: 'RESOLVED', severity: 'HIGH', assignee: 'Cuadrilla 1' }),
      incident({ district: null }),
    ]);
    expect(stats.total).toBe(3);
    expect(stats.byStatus).toEqual({ PENDING: 2, RESOLVED: 1 });
    expect(stats.bySeverity).toEqual({ HIGH: 1 });
    expect(stats.assigned).toBe(1);
    expect(topDistricts(stats)).toEqual([['Miraflores', 2], ['Sin distrito', 1]]);
  });

  it('calcula la variación sin dividir entre cero', () => {
    expect(change(15, 10)).toBe(50);
    expect(change(3, 0)).toBeNull();
  });
});

describe('notifications', () => {
  const base: ApiNotification = {
    id: 'n1',
    type: 'NEW_REPORT',
    incidentId: '0001e1f5-aaaa-bbbb-cccc-000000000001',
    incidentType: 'D40',
    district: 'San Borja',
    incidentStatus: 'PENDING',
    possibleDuplicates: 0,
    comment: null,
    reportedAt: '2026-10-14T10:00:00Z',
    title: 'Nuevo reporte registrado',
    message: 'Bache reportado en San Borja.',
    createdAt: '2026-10-14T10:00:01Z',
    read: false,
  };

  it('arma la fila con el mismo código REP que la app móvil', () => {
    const row = toOperatorNotification(base);
    expect(row.code).toBe('REP-2026-LM-23381');
    expect(row.message).toBe('Bache en');
    expect(row.highlight).toBe('San Borja');
    expect(row.tone).toBe('warning');
  });

  it('marca los posibles duplicados', () => {
    expect(toOperatorNotification({ ...base, possibleDuplicates: 1 }).tag).toBe('Posible duplicado');
    expect(toOperatorNotification({ ...base, possibleDuplicates: 3, district: null })).toMatchObject({
      tag: '3 posibles duplicados',
      tone: 'danger',
      highlight: 'Lima Metropolitana',
    });
  });
});

describe('assigneeOptions', () => {
  it('ofrece los operadores activos en orden alfabético y sin repetir', () => {
    expect(assigneeOptions([{ fullName: 'Rosa Quispe' }, { fullName: 'Ana Ccori' }, { fullName: 'Rosa Quispe' }], null)).toEqual(['Ana Ccori', 'Rosa Quispe']);
  });

  it('mantiene al responsable actual aunque ya no esté en la lista', () => {
    expect(assigneeOptions([{ fullName: 'Ana Ccori' }], 'Ing. Carlos Mendoza')).toEqual(['Ing. Carlos Mendoza', 'Ana Ccori']);
    expect(assigneeOptions([{ fullName: 'Ana Ccori' }], 'Ana Ccori')).toEqual(['Ana Ccori']);
  });
});
