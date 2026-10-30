import { useState } from 'react';

import { incidentApi } from '@/api/incident-api';
import { downloadFile, toCsv } from '@/domain/csv';
import { STATUS_FILTER_LABELS } from '@/domain/filters';
import {
  INCIDENT_TYPES,
  lastDays,
  percent,
  relativeTime,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUSES,
  TYPE_LABELS,
  type IncidentStatus,
  type IncidentType,
  type Statistics,
} from '@/domain/incident';
import { aggregate, change, statusCount, topDistricts } from '@/domain/statistics';
import { Icon } from '@/ui/badges';
import { SEVERITY_COLORS } from '@/ui/colors';
import { DamageTypeLabel } from '@/ui/damage-help';
import { StatusBreakdown } from '@/ui/status-breakdown';
import { useLoader } from '@/ui/use-loader';

import './statistics.css';

const PERIODS = [
  { value: 7, label: 'Últimos 7 días' },
  { value: 30, label: 'Últimos 30 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: 365, label: 'Último año' },
];

const TYPE_COLORS = ['#0f2042', '#0057c0', '#45506a', '#75777f'];

type Filters = { days: number; district: string; type: string; status: string };

async function statsFor(filters: Filters, range: { from: string; to: string }): Promise<{ stats: Statistics; partial: boolean }> {
  if (!filters.district && !filters.type && !filters.status) return { stats: await incidentApi.statistics(range), partial: false };
  // El endpoint de estadísticas solo filtra por fechas: con más filtros se calculan sobre la lista.
  const all = await incidentApi.searchAll(
    { ...range, district: filters.district || undefined, type: (filters.type || undefined) as IncidentType | undefined, status: (filters.status || undefined) as IncidentStatus | undefined },
    1000,
  );
  return { stats: aggregate(all.items), partial: all.totalItems > all.items.length };
}

async function loadStatistics(filters: Filters) {
  const range = lastDays(filters.days);
  const previousEnd = new Date();
  previousEnd.setDate(previousEnd.getDate() - filters.days);
  const [current, previous, districts] = await Promise.all([
    statsFor(filters, range),
    statsFor(filters, lastDays(filters.days, previousEnd)),
    incidentApi.statistics(lastDays(365)),
  ]);
  return { range, current: current.stats, previous: previous.stats, partial: current.partial, districts: Object.keys(districts.byDistrict).sort(), loadedAt: new Date() };
}

/** Pantalla 7 de Figma: "Estadísticas". */
export function StatisticsPage() {
  const [draft, setDraft] = useState<Filters>({ days: 30, district: '', type: '', status: '' });
  const [filters, setFilters] = useState<Filters>(draft);
  const { data, error, reload } = useLoader(() => loadStatistics(filters), JSON.stringify(filters), true);

  function exportReport() {
    if (!data) return;
    const { current, range } = data;
    const rows: (string | number)[][] = [
      ['Reporte de estadísticas ViaDeep', `${range.from} a ${range.to}`],
      [],
      ['Indicador', 'Valor'],
      ['Incidencias registradas', current.total],
      ...STATUSES.map((status) => [STATUS_FILTER_LABELS[status], statusCount(current, status)]),
      ['Asignadas', current.assigned],
      [],
      ['Tipo de daño', 'Cantidad'],
      ...INCIDENT_TYPES.map((type) => [TYPE_LABELS[type], current.byType[type] ?? 0]),
      [],
      ['Severidad', 'Cantidad'],
      ...SEVERITIES.map((severity) => [SEVERITY_LABELS[severity], current.bySeverity[severity] ?? 0]),
      [],
      ['Distrito', 'Cantidad'],
      ...topDistricts(current, 100),
    ];
    downloadFile(`estadisticas-viadeep-${range.from}-${range.to}.csv`, toCsv(rows));
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-sub">Análisis de incidencias y atención municipal en Lima Metropolitana.</p>
        </div>
        <div className="page-actions">
          <button className="period-pill mono stats-updated" onClick={reload} title="Actualizar">
            <Icon name="history" />
            Actualizado: {data ? relativeTime(data.loadedAt.toISOString()) : '—'}
          </button>
          <button className="btn btn-outline stats-export" onClick={exportReport} disabled={!data}>
            <Icon name="download" />
            Exportar Reporte
            <span className="mono muted">(CSV)</span>
          </button>
        </div>
      </div>

      <form
        className="card stats-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draft);
        }}
      >
        <label className="field">
          <span className="field-label">Periodo</span>
          <select className="select" value={draft.days} onChange={(event) => setDraft({ ...draft, days: Number(event.target.value) })}>
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Distrito / Sector</span>
          <select className="select" value={draft.district} onChange={(event) => setDraft({ ...draft, district: event.target.value })}>
            <option value="">Todos los distritos</option>
            {(data?.districts ?? []).map((district) => (
              <option key={district}>{district}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Tipo de incidencia</span>
          <select className="select" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
            <option value="">Todos los tipos</option>
            {INCIDENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Estado</span>
          <select className="select" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
            <option value="">Todos los estados</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_FILTER_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="stats-filter-actions">
          <button className="btn btn-primary" type="submit">
            <Icon name="filter_alt" />
            Aplicar
          </button>
          <button className="btn btn-outline" type="button" onClick={reload} aria-label="Recargar">
            <Icon name="refresh" />
          </button>
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {data ? <StatisticsContent {...data} /> : !error ? <p className="muted">Calculando estadísticas…</p> : null}
    </div>
  );
}

function StatisticsContent({ current, previous, partial }: Awaited<ReturnType<typeof loadStatistics>>) {
  const resolved = statusCount(current, 'RESOLVED');
  const pending = statusCount(current, 'PENDING');
  const inProgress = statusCount(current, 'IN_PROGRESS');
  const rejected = statusCount(current, 'REJECTED');
  const variation = change(current.total, previous.total);
  const rate = current.total ? (resolved / current.total) * 100 : 0;
  const districts = topDistricts(current);
  const maxDistrict = districts[0]?.[1] ?? 0;

  if (current.total === 0) {
    return (
      <div className="card stats-empty">
        <Icon name="query_stats" size={40} />
        <strong>No hay datos disponibles para generar estadísticas</strong>
        <span>No se registraron incidencias en este periodo o con estos filtros. Prueba con un periodo más amplio.</span>
      </div>
    );
  }

  return (
    <>
      {partial ? <p className="hint">Con estos filtros se calculó sobre las 1000 incidencias más recientes.</p> : null}
      <div className="grid-4">
        <div className="card kpi">
          <div className="kpi-head">
            Incidencias registradas <Icon name="assignment" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="kpi-value">
            {current.total.toLocaleString('es-PE')}
            {variation !== null ? (
              <span className="kpi-chip" style={{ background: 'var(--surface-blue)', color: 'var(--primary)' }}>
                <Icon name={variation >= 0 ? 'trending_up' : 'trending_down'} size={14} /> {variation >= 0 ? '+' : ''}
                {variation.toFixed(1)}% vs periodo anterior
              </span>
            ) : null}
          </div>
          <div className="stats-note">
            <span className="dot" style={{ background: 'var(--primary)', width: 6, height: 6 }} /> Total detectado en la red metropolitana
          </div>
        </div>
        <div className="card kpi">
          <div className="kpi-head">
            Incidencias resueltas <Icon name="check_circle" style={{ color: 'var(--success)' }} />
          </div>
          <div className="kpi-value">
            {resolved.toLocaleString('es-PE')}
            <span className="kpi-chip" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
              <Icon name="verified" size={14} /> {percent(resolved, current.total)} efectividad
            </span>
          </div>
          <div className="stats-note">
            <span className="dot" style={{ background: 'var(--success)', width: 6, height: 6 }} /> Atención de cuadrilla completada
          </div>
        </div>
        <div className="card kpi">
          <div className="kpi-head">
            Incidencias pendientes <Icon name="pending_actions" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="kpi-value">
            {(pending + inProgress).toLocaleString('es-PE')}
            <span className="mono" style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>
              {percent(pending + inProgress, current.total)} del total
            </span>
          </div>
          <div className="kpi-foot" style={{ marginTop: 0 }}>
            <span>{pending} en revisión</span>
            <span style={{ color: 'var(--primary)' }}>{inProgress} en proceso de cuadrilla</span>
          </div>
        </div>
        <div className="card kpi">
          <div className="kpi-head">
            Tasa de resolución <Icon name="speed" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="kpi-value">{rate.toFixed(1)}%</div>
          <div className="bar" style={{ height: 8 }}>
            <span style={{ width: `${rate}%`, background: 'var(--success)' }} />
          </div>
          <div className="stats-note">{rejected} rechazadas como infundadas</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Incidencias por estado</div>
              <div className="card-sub">Distribución del ciclo de vida operativo</div>
            </div>
            <Icon name="donut_large" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <StatusBreakdown stats={current} />
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Incidencias por tipo de daño</div>
              <div className="card-sub">Clasificación de LMD-YOLO (visión artificial en el celular)</div>
            </div>
            <Icon name="category" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="type-bars">
            {INCIDENT_TYPES.map((type, index) => {
              const value = current.byType[type] ?? 0;
              return (
                <div key={type}>
                  <div className="type-bar-head">
                    <DamageTypeLabel type={type} />
                    <span className="mono">
                      <strong>{value}</strong> ({percent(value, current.total)})
                    </span>
                  </div>
                  <div className="bar" style={{ height: 12 }}>
                    <span style={{ width: current.total ? `${(value / current.total) * 100}%` : 0, background: TYPE_COLORS[index] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Incidencias por distrito</div>
              <div className="card-sub">Los 10 distritos con más reportes</div>
            </div>
            <Icon name="location_city" style={{ color: 'var(--text-secondary)' }} />
          </div>
          {districts.length === 0 ? <p className="muted">Sin datos en este periodo.</p> : null}
          <div className="type-bars">
            {districts.map(([district, value]) => (
              <div key={district}>
                <div className="type-bar-head">
                  <span>{district}</span>
                  <span className="mono">
                    <strong>{value}</strong> ({percent(value, current.total)})
                  </span>
                </div>
                <div className="bar" style={{ height: 8 }}>
                  <span style={{ width: `${(value / maxDistrict) * 100}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Incidencias por severidad</div>
              <div className="card-sub">Asignada por los operadores al revisar cada reporte</div>
            </div>
            <Icon name="priority_high" style={{ color: 'var(--text-secondary)' }} />
          </div>
          {[...SEVERITIES].reverse().map((severity) => {
            const value = current.bySeverity[severity] ?? 0;
            return (
              <div className="legend-row" key={severity}>
                <span className="dot" style={{ background: SEVERITY_COLORS[severity].color, width: 10, height: 10 }} />
                {SEVERITY_LABELS[severity]}
                <span className="num">{value}</span>
                <span className="pct">{percent(value, current.total)}</span>
              </div>
            );
          })}
          <div className="legend-row">
            <span className="dot" style={{ background: 'var(--border)', width: 10, height: 10 }} />
            Sin evaluar
            <span className="num">{current.total - Object.values(current.bySeverity).reduce((sum, value) => sum + (value ?? 0), 0)}</span>
            <span className="pct" />
          </div>
        </div>
      </div>
    </>
  );
}
