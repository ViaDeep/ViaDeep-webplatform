import { percent, type Statistics } from '@/domain/incident';

/** Barra apilada y filas por estado (también la usa Estadísticas). */
export function StatusBreakdown({ stats }: { stats: Statistics }) {
  const rows = [
    { key: 'RESOLVED', label: 'Resueltas', color: 'var(--success)' },
    { key: 'IN_PROGRESS', label: 'En proceso', color: 'var(--info)' },
    { key: 'PENDING', label: 'Registradas / En revisión', color: 'var(--orange)' },
    { key: 'REJECTED', label: 'Rechazadas', color: 'var(--gray-dot)' },
  ] as const;
  return (
    <>
      <div className="bar" style={{ height: 12, marginBottom: 18 }}>
        {rows.map((row) => (
          <span key={row.key} style={{ width: stats.total ? `${((stats.byStatus[row.key] ?? 0) / stats.total) * 100}%` : 0, background: row.color }} />
        ))}
      </div>
      {rows.map((row) => {
        const value = stats.byStatus[row.key] ?? 0;
        return (
          <div className="legend-row" key={row.key}>
            <span className="dot" style={{ background: row.color, width: 10, height: 10 }} />
            {row.label}
            <span className="num">{value.toLocaleString('es-PE')}</span>
            <span className="pct">{percent(value, stats.total)}</span>
          </div>
        );
      })}
    </>
  );
}
