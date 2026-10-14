import { describe, expect, it } from 'vitest';

import type { IncidentSummary } from '@/domain/incident';
import { aggregate, change, topDistricts } from '@/domain/statistics';
import { buildNotifications, initialReadState, isUnread } from '@/notifications/notifications';
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
  it('genera registro, asignación y actualización, del más reciente al más antiguo', () => {
    const notifications = buildNotifications([
      incident({
        status: 'IN_PROGRESS',
        severity: 'MEDIUM',
        assignee: 'Cuadrilla 1',
        assignedAt: '2026-10-11T09:00:00Z',
        updatedAt: '2026-10-12T09:00:00Z',
      }),
    ]);
    expect(notifications.map((n) => n.kind)).toEqual(['UPDATED', 'ASSIGNED', 'NEW_REPORT']);
  });

  it('no duplica el aviso cuando el único cambio fue la asignación', () => {
    const notifications = buildNotifications([
      incident({ assignee: 'Cuadrilla 1', assignedAt: '2026-10-11T09:00:00Z', updatedAt: '2026-10-11T09:00:00Z' }),
    ]);
    expect(notifications.map((n) => n.kind)).toEqual(['ASSIGNED', 'NEW_REPORT']);
  });

  it('considera leídos los avisos de más de 7 días', () => {
    const state = initialReadState(new Date('2026-10-14T00:00:00Z'));
    const [old] = buildNotifications([incident({ createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' })]);
    const [recent] = buildNotifications([incident()]);
    expect(isUnread(old!, state)).toBe(false);
    expect(isUnread(recent!, state)).toBe(true);
  });
});
