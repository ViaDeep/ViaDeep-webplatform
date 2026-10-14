import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMap } from 'react-leaflet';

import { incidentApi } from '@/api/incident-api';
import {
  DISPLAY_STATUS_LABELS,
  displayStatus,
  formatTime,
  INCIDENT_TYPES,
  lastDays,
  relativeTime,
  reportCode,
  SEVERITY_LABELS,
  TYPE_LABELS,
  type DisplayStatus,
  type IncidentSummary,
  type IncidentType,
  type Severity,
} from '@/domain/incident';
import { Icon } from '@/ui/badges';
import { SEVERITY_COLORS } from '@/ui/colors';
import { IncidentMap, type BaseLayer } from '@/ui/incident-map';
import { MARKER_LEGEND } from '@/ui/map-style';
import { useLoader } from '@/ui/use-loader';

import './map.css';

const WINDOWS = [
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '', label: 'Todo el historial' },
] as const;

const MAP_STATUSES: DisplayStatus[] = ['IN_REVIEW', 'REGISTERED', 'IN_PROGRESS', 'RESOLVED'];
const MAP_SEVERITIES: Severity[] = ['HIGH', 'MEDIUM', 'LOW'];

type MapFilters = {
  types: IncidentType[];
  statuses: DisplayStatus[];
  severities: Severity[];
  district: string;
  showRejected: boolean;
  onlyAssigned: boolean;
};

const DEFAULT_FILTERS: MapFilters = {
  types: [...INCIDENT_TYPES],
  statuses: [...MAP_STATUSES],
  severities: [],
  district: '',
  showRejected: false,
  onlyAssigned: false,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function passes(incident: IncidentSummary, filters: MapFilters): boolean {
  const status = displayStatus(incident.status, incident.severity);
  if (!filters.types.includes(incident.type)) return false;
  if (status === 'REJECTED' ? !filters.showRejected : !filters.statuses.includes(status)) return false;
  if (filters.severities.length > 0 && (!incident.severity || !filters.severities.includes(incident.severity))) return false;
  if (filters.district && incident.district !== filters.district) return false;
  if (filters.onlyAssigned && !incident.assignee) return false;
  return true;
}

/** Pantalla 5 de Figma: "Mapa SIG de Incidencias Viales". */
export function MapPage() {
  const [params] = useSearchParams();
  const focusId = params.get('foco');
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState('30');
  const [layer, setLayer] = useState<BaseLayer>('streets');
  const [draft, setDraft] = useState<MapFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(focusId);

  const { data, error } = useLoader(async () => {
    const all = await incidentApi.searchAll(windowDays ? lastDays(Number(windowDays)) : {}, 1000);
    if (focusId && !all.items.some((incident) => incident.id === focusId)) {
      const focus = await incidentApi.detail(focusId).catch(() => null);
      if (focus) all.items.unshift(focus);
    }
    return all;
  }, `${windowDays}:${focusId ?? ''}`);

  const incidents = useMemo(() => data?.items ?? [], [data]);
  const visible = useMemo(() => incidents.filter((incident) => passes(incident, filters)), [incidents, filters]);
  const draftCount = useMemo(() => incidents.filter((incident) => passes(incident, draft)).length, [incidents, draft]);
  const districts = useMemo(() => [...new Set(incidents.map((incident) => incident.district).filter((value): value is string => Boolean(value)))].sort(), [incidents]);
  const selected = incidents.find((incident) => incident.id === selectedId) ?? null;

  const typeCount = (type: IncidentType) => incidents.filter((incident) => incident.type === type).length;
  const statusCount = (status: DisplayStatus) => incidents.filter((incident) => displayStatus(incident.status, incident.severity) === status).length;
  const severityCount = (severity: Severity) => incidents.filter((incident) => incident.severity === severity).length;

  return (
    <div className="map-page">
      <IncidentMap incidents={visible} layer={layer} selectedId={selectedId} focusId={focusId} onSelect={(incident) => setSelectedId(incident.id)}>
        <ZoomControls incidents={visible} />
      </IncidentMap>

      <div className="map-overlay map-title-wrap">
        <div className="card map-title">
          <span className="map-title-icon">
            <Icon name="layers" fill />
          </span>
          <div>
            <div className="map-title-name">
              Mapa SIG <span className="tag map-tag">OpenStreetMap</span>
            </div>
            <div className="map-title-sub">Visualización georreferenciada de incidencias viales</div>
          </div>
        </div>
        <div className="card map-count mono">
          <span className="dot" style={{ background: 'var(--primary)' }} />
          <strong>{visible.length.toLocaleString('es-PE')} Marcadores visibles</strong> en Lima Metropolitana
          {data && data.totalItems > incidents.length ? <span className="muted"> (de las {incidents.length} más recientes)</span> : null}
        </div>
        {error ? <div className="card map-count error">{error}</div> : null}
      </div>

      <div className="map-overlay map-layers card">
        <button className={layer === 'streets' ? 'on' : ''} onClick={() => setLayer('streets')}>
          Calles
        </button>
        <button className={layer === 'satellite' ? 'on' : ''} onClick={() => setLayer('satellite')}>
          Satélite
        </button>
      </div>

      {selected ? (
        <div className={panelOpen ? 'map-overlay map-popup card' : 'map-overlay map-popup card wide'}>
          <div className="map-popup-head">
            <span className="mono">
              <Icon name="verified" size={16} /> #{reportCode(selected.id, selected.createdAt)}
            </span>
            <button className="icon-btn" onClick={() => setSelectedId(null)} aria-label="Cerrar">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="map-popup-title">
            {TYPE_LABELS[selected.type]} en {selected.district ?? 'Lima'}
          </div>
          <div className="map-popup-place">
            <Icon name="location_on" size={16} /> {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
          </div>
          <div className="map-popup-tags">
            {selected.severity ? (
              <span className="badge" style={{ color: SEVERITY_COLORS[selected.severity].text, background: SEVERITY_COLORS[selected.severity].background }}>
                <span className="dot" style={{ background: SEVERITY_COLORS[selected.severity].color }} /> Severidad: {SEVERITY_LABELS[selected.severity]}
              </span>
            ) : null}
            <span className="badge" style={{ background: 'var(--surface-muted)' }}>
              {DISPLAY_STATUS_LABELS[displayStatus(selected.status, selected.severity)]}
            </span>
          </div>
          <div className="map-popup-grid">
            <div>
              <span className="label">Detección</span>
              <strong className="mono">{relativeTime(selected.createdAt)}</strong>
            </div>
            <div>
              <span className="label">Origen</span>
              <strong className="mono">{selected.aiValidated ? 'IA en celular' : 'Manual'}</strong>
            </div>
          </div>
          {selected.assignee ? (
            <div className="map-popup-place">
              <Icon name="engineering" size={16} /> {selected.assignee}
            </div>
          ) : null}
          <button className="btn btn-navy btn-block" onClick={() => navigate(`/incidencias/${selected.id}`)}>
            <Icon name="visibility" />
            Ver expediente
          </button>
          <span className="mono muted" style={{ fontSize: 10 }}>
            Actualizado: {formatTime(selected.updatedAt)}
          </span>
        </div>
      ) : null}

      <aside className={panelOpen ? 'map-overlay map-panel card' : 'map-overlay map-panel card closed'}>
        <button className="map-panel-head" onClick={() => setPanelOpen((value) => !value)}>
          <Icon name="tune" />
          {panelOpen ? <span>Filtros Geoespaciales</span> : null}
          <Icon name={panelOpen ? 'chevron_right' : 'chevron_left'} />
        </button>
        {panelOpen ? (
          <>
            <div className="map-panel-body">
              <section>
                <h3 className="label">Tipo de daño vial</h3>
                {INCIDENT_TYPES.map((type) => (
                  <label key={type} className="checkbox map-check">
                    <input type="checkbox" checked={draft.types.includes(type)} onChange={() => setDraft({ ...draft, types: toggle(draft.types, type) })} />
                    <span>{TYPE_LABELS[type]}</span>
                    <span className="mono muted">{typeCount(type)}</span>
                  </label>
                ))}
              </section>
              <section>
                <h3 className="label">Estado operacional</h3>
                <div className="map-buttons">
                  {MAP_STATUSES.map((status) => (
                    <button
                      key={status}
                      className={draft.statuses.includes(status) ? 'on' : ''}
                      onClick={() => setDraft({ ...draft, statuses: toggle(draft.statuses, status) })}
                    >
                      {DISPLAY_STATUS_LABELS[status]} ({statusCount(status)})
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="label">Clasificación de severidad</h3>
                <div className="map-buttons three">
                  {MAP_SEVERITIES.map((severity) => (
                    <button
                      key={severity}
                      className={draft.severities.includes(severity) ? 'on' : ''}
                      onClick={() => setDraft({ ...draft, severities: toggle(draft.severities, severity) })}
                      title={`${severityCount(severity)} incidencias`}
                    >
                      <span className="dot" style={{ background: SEVERITY_COLORS[severity].color }} /> {SEVERITY_LABELS[severity]}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="label">Ventana temporal</h3>
                <select className="select" value={windowDays} onChange={(event) => setWindowDays(event.target.value)}>
                  {WINDOWS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </section>
              <section>
                <h3 className="label">Distrito / cuadrante vial</h3>
                <span className="input-icon">
                  <Icon name="location_city" />
                  <select className="select" style={{ paddingLeft: 36 }} value={draft.district} onChange={(event) => setDraft({ ...draft, district: event.target.value })}>
                    <option value="">Todos los distritos</option>
                    {districts.map((district) => (
                      <option key={district}>{district}</option>
                    ))}
                  </select>
                </span>
              </section>
              <section className="map-switches">
                <label>
                  <span>Solo incidencias asignadas</span>
                  <span className="switch">
                    <input type="checkbox" checked={draft.onlyAssigned} onChange={(event) => setDraft({ ...draft, onlyAssigned: event.target.checked })} />
                    <span />
                  </span>
                </label>
                <label>
                  <span>Mostrar rechazadas</span>
                  <span className="switch">
                    <input type="checkbox" checked={draft.showRejected} onChange={(event) => setDraft({ ...draft, showRejected: event.target.checked })} />
                    <span />
                  </span>
                </label>
              </section>
            </div>
            <div className="map-panel-foot">
              <div className="mono map-results">
                <span>Resultados filtrados:</span>
                <strong>
                  {draftCount} de {incidents.length} incidencias
                </strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-navy" style={{ flex: 1 }} onClick={() => setFilters(draft)}>
                  <Icon name="check" />
                  Aplicar filtros
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setDraft(DEFAULT_FILTERS);
                    setFilters(DEFAULT_FILTERS);
                  }}
                >
                  Restablecer
                </button>
              </div>
            </div>
          </>
        ) : null}
      </aside>

      <div className="map-overlay map-legend-card card">
        <span className="label">Simbología georreferenciada</span>
        <div className="map-legend-items">
          {MARKER_LEGEND.map((item) => (
            <span key={item.key}>
              <span className="dot" style={{ background: item.color, width: 10, height: 10 }} /> {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ZoomControls({ incidents }: { incidents: IncidentSummary[] }) {
  const map = useMap();
  function fitAll() {
    if (incidents.length === 0) return;
    const lats = incidents.map((incident) => incident.latitude);
    const lngs = incidents.map((incident) => incident.longitude);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 15 },
    );
  }
  return (
    <div className="map-zoom card">
      <span className="mono map-north">N</span>
      <button onClick={() => map.zoomIn()} aria-label="Acercar">
        <Icon name="add" />
      </button>
      <button onClick={() => map.zoomOut()} aria-label="Alejar">
        <Icon name="remove" />
      </button>
      <button onClick={fitAll} aria-label="Ver todas las incidencias">
        <Icon name="my_location" />
      </button>
    </div>
  );
}
