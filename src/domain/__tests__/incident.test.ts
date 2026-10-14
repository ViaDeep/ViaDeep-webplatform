import { describe, expect, it } from 'vitest';

import { nextStatuses, reportCode } from '../incident';

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
});
