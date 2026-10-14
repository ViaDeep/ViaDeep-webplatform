import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { errorMessage } from '@/api/http';
import { incidentApi } from '@/api/incident-api';
import {
  formatDateTime,
  INCIDENT_TYPES,
  reportCode,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  TYPE_LABELS,
  type IncidentStatus,
  type IncidentSummary,
  type IncidentType,
  type Severity,
} from '@/domain/incident';
import { SeverityBadge, StatusBadge } from '@/ui/badges';

const PAGE_SIZE = 20;

/** Pantalla 3 de Figma: "Gestión de Incidencias — Tabla Principal" (estructura provisional). */
export function IncidentsPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as IncidentStatus | null) ?? undefined;
  const type = (params.get('type') as IncidentType | null) ?? undefined;
  const severity = (params.get('severity') as Severity | null) ?? undefined;
  const district = params.get('district') ?? '';
  const page = Number(params.get('page') ?? '0');

  const [items, setItems] = useState<IncidentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    incidentApi
      .search({ status, type, severity, district: district || undefined, page, size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.totalItems);
        setError(null);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, type, severity, district, page]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setLoading(true);
    setParams(next);
  }

  function goTo(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setLoading(true);
    setParams(next);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section>
      <h1 className="page-title">Gestión de incidencias</h1>
      <p className="page-sub">{total} reportes en total.</p>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 14, marginBottom: 16 }}>
        <Select label="Estado" value={status ?? ''} onChange={(v) => setFilter('status', v)} options={STATUSES.map((s) => [s, STATUS_LABELS[s]])} />
        <Select label="Tipo" value={type ?? ''} onChange={(v) => setFilter('type', v)} options={INCIDENT_TYPES.map((t) => [t, `${t} · ${TYPE_LABELS[t]}`])} />
        <Select label="Prioridad" value={severity ?? ''} onChange={(v) => setFilter('severity', v)} options={SEVERITIES.map((s) => [s, SEVERITY_LABELS[s]])} />
        <label className="field">
          <span>Distrito</span>
          <input className="input" defaultValue={district} placeholder="Ej. Miraflores" onKeyDown={(e) => e.key === 'Enter' && setFilter('district', e.currentTarget.value.trim())} onBlur={(e) => e.currentTarget.value.trim() !== district && setFilter('district', e.currentTarget.value.trim())} />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {['Código', 'Tipo', 'Distrito', 'Prioridad', 'Estado', 'IA', 'Fecha'].map((h) => (
                <th key={h} className="label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((incident) => (
              <tr key={incident.id} className="row" onClick={() => navigate(`/incidencias/${incident.id}`)}>
                <td className="mono">{reportCode(incident.id, incident.createdAt)}</td>
                <td>{TYPE_LABELS[incident.type]}</td>
                <td>{incident.district ?? 'Sin distrito'}</td>
                <td><SeverityBadge severity={incident.severity} /></td>
                <td><StatusBadge status={incident.status} /></td>
                <td>{incident.aiValidated ? 'Validado' : 'Manual'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(incident.createdAt)}</td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr><td colSpan={7} style={{ color: 'var(--text-muted)' }}>No hay reportes con estos filtros.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <button className="btn btn-outline" disabled={page === 0} onClick={() => goTo(page - 1)}>Anterior</button>
        <span className="mono">{page + 1} / {pages}</span>
        <button className="btn btn-outline" disabled={page + 1 >= pages} onClick={() => goTo(page + 1)}>Siguiente</button>
      </div>
    </section>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </label>
  );
}
