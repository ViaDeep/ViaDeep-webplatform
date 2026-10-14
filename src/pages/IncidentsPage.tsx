import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { errorMessage } from '@/api/http';
import { incidentApi, type IncidentFilters } from '@/api/incident-api';
import { downloadFile, incidentsCsv } from '@/domain/csv';
import { RANGES, STATUS_FILTER_LABELS } from '@/domain/filters';
import {
  formatDate,
  formatTime,
  INCIDENT_TYPES,
  lastDays,
  reportCode,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUSES,
  TYPE_ICONS,
  TYPE_LABELS,
  type IncidentStatus,
  type IncidentSummary,
  type IncidentType,
  type Severity,
} from '@/domain/incident';
import { Icon, SeverityBadge, StatusBadge } from '@/ui/badges';
import { Pagination } from '@/ui/pagination';
import { useLoader } from '@/ui/use-loader';

import './incidents.css';

const PAGE_SIZES = [10, 25, 50];

type Filters = { q: string; estado: string; tipo: string; severidad: string; rango: string };

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    estado: params.get('estado') ?? '',
    tipo: params.get('tipo') ?? '',
    severidad: params.get('severidad') ?? '',
    rango: params.get('rango') ?? '',
  };
}

function toApi(filters: Filters): IncidentFilters {
  return {
    status: (filters.estado || undefined) as IncidentStatus | undefined,
    type: (filters.tipo || undefined) as IncidentType | undefined,
    severity: (filters.severidad || undefined) as Severity | undefined,
    ...(filters.rango ? lastDays(Number(filters.rango)) : {}),
  };
}

/** Coincidencia del buscador: código REP, distrito, tipo o responsable. */
function matches(incident: IncidentSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return [reportCode(incident.id, incident.createdAt), incident.district, TYPE_LABELS[incident.type], incident.assignee]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

/** Pantalla 3 de Figma: "Gestión de Incidencias — Tabla Principal". */
export function IncidentsPage() {
  const [params, setParams] = useSearchParams();
  const applied = readFilters(params);
  const page = Number(params.get('page') ?? '0');
  const size = Number(params.get('size') ?? '10');
  const [draft, setDraft] = useState<Filters>(applied);
  const [draftKey, setDraftKey] = useState(params.toString());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Si la URL cambia desde fuera (buscador superior, enlaces), el formulario la refleja.
  if (draftKey !== params.toString()) {
    setDraftKey(params.toString());
    setDraft(applied);
  }

  const { data, error, loading } = useLoader(async () => {
    const filters = toApi(applied);
    if (!applied.q.trim()) {
      const result = await incidentApi.search({ ...filters, page, size });
      return { items: result.items, total: result.totalItems, loadedAt: new Date() };
    }
    // El backend aún no busca por texto: se filtra sobre las 1000 incidencias más recientes.
    const all = await incidentApi.searchAll(filters, 1000);
    const found = all.items.filter((incident) => matches(incident, applied.q));
    return { items: found.slice(page * size, (page + 1) * size), total: found.length, loadedAt: new Date() };
  }, `${params.toString()}`);

  function commit(filters: Filters, extra: Record<string, string> = {}) {
    const next = new URLSearchParams();
    Object.entries({ ...filters, ...extra }).forEach(([key, value]) => value && next.set(key, value));
    if (size !== 10 && !('size' in extra)) next.set('size', String(size));
    setParams(next);
  }

  function goTo(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  }

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const all = await incidentApi.searchAll(toApi(applied), 1000);
      const rows = applied.q.trim() ? all.items.filter((incident) => matches(incident, applied.q)) : all.items;
      downloadFile(`incidencias-viadeep-${new Date().toISOString().slice(0, 10)}.csv`, incidentsCsv(rows));
    } catch (e) {
      setExportError(errorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  const chips: { key: keyof Filters; label: string }[] = [
    applied.q ? { key: 'q', label: `Búsqueda: ${applied.q}` } : null,
    applied.estado ? { key: 'estado', label: `Estado: ${STATUS_FILTER_LABELS[applied.estado as IncidentStatus]}` } : null,
    applied.tipo ? { key: 'tipo', label: `Tipo: ${TYPE_LABELS[applied.tipo as IncidentType]}` } : null,
    applied.severidad ? { key: 'severidad', label: `Severidad: ${SEVERITY_LABELS[applied.severidad as Severity]}` } : null,
    applied.rango ? { key: 'rango', label: `Periodo: ${RANGES.find((range) => range.value === applied.rango)?.label}` } : null,
  ].filter((chip): chip is { key: keyof Filters; label: string } => chip !== null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">
            Operaciones <span>/</span> <strong>Gestión de Incidencias</strong>
          </div>
          <h1 className="page-title">Incidencias</h1>
          <p className="page-sub">Consulta y gestión de reportes viales en Lima Metropolitana</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => void exportCsv()} disabled={exporting}>
            <Icon name="download" />
            {exporting ? 'Exportando…' : 'Exportar'}
          </button>
        </div>
      </div>
      {exportError ? <p className="error">{exportError}</p> : null}

      <form
        className="card filters"
        onSubmit={(event) => {
          event.preventDefault();
          commit(draft);
        }}
      >
        <div className="filters-grid">
          <label className="field filters-search">
            <span className="field-label">Buscar reporte o vía</span>
            <span className="input-icon">
              <Icon name="search" />
              <input
                className="input"
                placeholder="Buscar por código, distrito o responsable…"
                value={draft.q}
                onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Estado</span>
            <select className="select" value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value })}>
              <option value="">Todos</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_FILTER_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tipo de incidencia</span>
            <select className="select" value={draft.tipo} onChange={(event) => setDraft({ ...draft, tipo: event.target.value })}>
              <option value="">Todos</option>
              {INCIDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Severidad</span>
            <select className="select" value={draft.severidad} onChange={(event) => setDraft({ ...draft, severidad: event.target.value })}>
              <option value="">Todas</option>
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Rango de fecha</span>
            <select className="select" value={draft.rango} onChange={(event) => setDraft({ ...draft, rango: event.target.value })}>
              {RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filters-active">
          <span className="mono filters-active-label">Filtros activos:</span>
          <span className="chip">Jurisdicción: Lima Metropolitana</span>
          {chips.map((chip) => (
            <span className="chip" key={chip.key}>
              {chip.label}
              <button type="button" aria-label={`Quitar ${chip.label}`} onClick={() => commit({ ...applied, [chip.key]: '' })}>
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
          {data ? (
            <span className="mono filters-count">{data.total.toLocaleString('es-PE')} resultados encontrados</span>
          ) : null}
        </div>
        <div className="filters-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => commit({ q: '', estado: '', tipo: '', severidad: '', rango: '' })}
          >
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary">
            <Icon name="filter_alt" />
            Aplicar filtros
          </button>
        </div>
      </form>

      <div className="card">
        <div className="table-title">
          <span className="dot" style={{ background: 'var(--primary)', width: 10, height: 10 }} />
          <strong>Consola Maestra de Telemetría e Incidentes Viales</strong>
          <span className="mono table-title-meta">
            Sincronización: <strong>{data ? `${formatTime(data.loadedAt.toISOString())}` : '—'}</strong>
          </span>
        </div>
        {error ? <p className="error" style={{ padding: 16 }}>{error}</p> : null}
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID Incidente</th>
                <th>Fecha / Hora</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Ubicación (distrito)</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th aria-label="Ver" />
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((incident) => (
                <tr key={incident.id}>
                  <td>
                    <Link className="code" to={`/incidencias/${incident.id}`}>
                      {reportCode(incident.id, incident.createdAt)}
                    </Link>
                  </td>
                  <td className="mono cell-date">
                    {formatDate(incident.createdAt)} ·<br />
                    {formatTime(incident.createdAt)}
                  </td>
                  <td>
                    <span className="cell-type">
                      <Icon name={TYPE_ICONS[incident.type]} size={16} />
                      {TYPE_LABELS[incident.type]}
                    </span>
                  </td>
                  <td>
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td className="cell-place">
                    {incident.district ?? 'Sin distrito'}
                    <span className="mono">
                      {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={incident.status} severity={incident.severity} />
                  </td>
                  <td>{incident.assignee ?? <span className="muted">—</span>}</td>
                  <td>
                    <Link to={`/incidencias/${incident.id}`} className="icon-btn" title="Ver expediente" style={{ color: 'var(--primary)' }}>
                      <Icon name="visibility" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 ? <p className="empty">No hay incidencias con estos filtros.</p> : null}
          {loading && !data ? <p className="empty">Cargando incidencias…</p> : null}
        </div>
        {data ? (
          <Pagination
            page={page}
            size={size}
            total={data.total}
            noun="incidencias registradas"
            sizes={PAGE_SIZES}
            onPage={goTo}
            onSize={(value) => commit(applied, { size: String(value) })}
          />
        ) : null}
      </div>
    </div>
  );
}
