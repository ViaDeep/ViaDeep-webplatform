import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { errorMessage } from '@/api/http';
import { incidentApi } from '@/api/incident-api';
import { formatDateTime, reportCode, STATUS_LABELS, STATUSES, TYPE_LABELS, type IncidentSummary, type Statistics } from '@/domain/incident';
import { StatusBadge } from '@/ui/badges';

/** Pantalla 2 de Figma: "Dashboard del Operador Municipal" (estructura provisional). */
export function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [recent, setRecent] = useState<IncidentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([incidentApi.statistics(), incidentApi.search({ size: 5 })])
      .then(([s, page]) => {
        setStats(s);
        setRecent(page.items);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Resumen de los reportes viales de Lima Metropolitana.</p>
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Kpi label="Total" value={stats?.total} />
        {STATUSES.map((status) => (
          <Kpi key={status} label={STATUS_LABELS[status]} value={stats ? (stats.byStatus[status] ?? 0) : undefined} />
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
          <span className="label">Últimos reportes</span>
          <Link to="/incidencias">Ver todos</Link>
        </div>
        <table className="table">
          <tbody>
            {recent.map((incident) => (
              <tr key={incident.id} className="row" onClick={() => navigate(`/incidencias/${incident.id}`)}>
                <td className="mono">{reportCode(incident.id, incident.createdAt)}</td>
                <td>{TYPE_LABELS[incident.type]}</td>
                <td>{incident.district ?? 'Sin distrito'}</td>
                <td><StatusBadge status={incident.status} /></td>
                <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(incident.createdAt)}</td>
              </tr>
            ))}
            {recent.length === 0 && !error ? (
              <tr><td style={{ color: 'var(--text-muted)' }}>Aún no hay reportes.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="label">{label}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value ?? '—'}</div>
    </div>
  );
}
