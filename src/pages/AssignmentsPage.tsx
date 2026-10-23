import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { incidentApi, type IncidentFilters } from '@/api/incident-api';
import { reportCode, TYPE_ICONS, TYPE_LABELS, type IncidentSummary } from '@/domain/incident';
import { AssignModal } from '@/ui/assign-modal';
import { Icon, SeverityBadge, StatusBadge } from '@/ui/badges';
import { Pagination } from '@/ui/pagination';
import { useLoader } from '@/ui/use-loader';

import './assignments.css';

const VIEWS = {
  unassigned: { label: 'Sin asignar (pendientes)', filters: { assigned: false, status: 'PENDING' } },
  assigned: { label: 'Asignadas', filters: { assigned: true } },
  progress: { label: 'En atención', filters: { status: 'IN_PROGRESS' } },
  all: { label: 'Todas', filters: {} },
} satisfies Record<string, { label: string; filters: IncidentFilters }>;

type View = keyof typeof VIEWS;
const PAGE_SIZE = 10;

async function loadCounters() {
  const [unassigned, assigned, inProgress] = await Promise.all([
    incidentApi.search({ assigned: false, status: 'PENDING', size: 1 }),
    incidentApi.search({ assigned: true, size: 1 }),
    incidentApi.search({ status: 'IN_PROGRESS', size: 1 }),
  ]);
  return {
    unassigned: unassigned.totalItems,
    assigned: assigned.totalItems,
    inProgress: inProgress.totalItems,
  };
}

/** Pantalla 6 de Figma: "Asignaciones". */
export function AssignmentsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('unassigned');
  const [draftView, setDraftView] = useState<View>('unassigned');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [assigning, setAssigning] = useState<IncidentSummary | null>(null);
  const counters = useLoader(loadCounters, 'counters', true);
  const list = useLoader(() => incidentApi.search({ ...VIEWS[view].filters, page, size: PAGE_SIZE }), `${view}:${page}`, true);

  const needle = query.trim().toLowerCase();
  const rows = (list.data?.items ?? []).filter(
    (incident) =>
      !needle ||
      [reportCode(incident.id, incident.createdAt), incident.district, incident.assignee, TYPE_LABELS[incident.type]]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
  );

  return (
    <div className="page">
      <div className="card card-pad assign-head">
        <div>
          <h1 className="page-title">Asignaciones</h1>
          <p className="page-sub">Gestión de responsables para la atención de incidencias</p>
        </div>
        <div className="assign-counters">
          <span className="counter danger">
            <span className="dot" /> Pendientes de asignar: <strong>{counters.data?.unassigned ?? '—'}</strong>
          </span>
          <span className="counter info">
            <span className="dot" /> Asignadas: <strong>{counters.data?.assigned ?? '—'}</strong>
          </span>
          <span className="counter success">
            <span className="dot" /> En atención: <strong>{counters.data?.inProgress ?? '—'}</strong>
          </span>
        </div>
      </div>

      <form
        className="card assign-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setView(draftView);
          setPage(0);
        }}
      >
        <span className="input-icon assign-search">
          <Icon name="search" />
          <input className="input" placeholder="Buscar en la página por código, distrito o responsable" value={query} onChange={(event) => setQuery(event.target.value)} />
        </span>
        <label className="assign-select">
          <span className="mono">Estado:</span>
          <select className="select" value={draftView} onChange={(event) => setDraftView(event.target.value as View)}>
            {Object.entries(VIEWS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-navy" type="submit">
          <Icon name="filter_alt" />
          Filtrar
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            setQuery('');
            setDraftView('unassigned');
            setView('unassigned');
            setPage(0);
          }}
        >
          Limpiar
        </button>
      </form>

      <div className="card">
        {list.error ? <p className="error" style={{ padding: 16 }}>{list.error}</p> : null}
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Severidad</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((incident) => {
                const closed = incident.status === 'RESOLVED' || incident.status === 'REJECTED';
                return (
                  <tr key={incident.id}>
                    <td>
                      <Link className="code" to={`/incidencias/${incident.id}`}>
                        {reportCode(incident.id, incident.createdAt).replace(/^REP-\d{4}-LM-/, 'REP-')}
                      </Link>
                    </td>
                    <td>
                      <span className="cell-type">
                        <Icon name={TYPE_ICONS[incident.type]} size={16} />
                        {TYPE_LABELS[incident.type]}
                      </span>
                    </td>
                    <td>{incident.district ?? 'Sin distrito'}</td>
                    <td>
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td>
                      {incident.assignee ? (
                        <span className="assignee">
                          <Icon name="engineering" size={16} />
                          <span>
                            {incident.assignee}
                            {incident.assignedArea ? <small>{incident.assignedArea}</small> : null}
                          </span>
                        </span>
                      ) : (
                        <span className="assignee none">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={incident.status} severity={incident.severity} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {closed ? (
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/incidencias/${incident.id}`)}>
                          Ver
                        </button>
                      ) : incident.assignee ? (
                        <button className="btn btn-outline btn-sm" onClick={() => setAssigning(incident)}>
                          Reasignar
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setAssigning(incident)}>
                          <Icon name="person_add" size={16} />
                          Asignar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.data && rows.length === 0 ? <p className="empty">No hay incidencias en esta vista.</p> : null}
          {list.loading && !list.data ? <p className="empty">Cargando…</p> : null}
        </div>
        {list.data ? (
          <Pagination page={page} size={PAGE_SIZE} total={list.data.totalItems} noun="incidencias registradas" onPage={setPage} />
        ) : null}
      </div>

      {assigning ? (
        <AssignModal
          incident={assigning}
          onClose={() => setAssigning(null)}
          onAssigned={() => {
            setAssigning(null);
            list.reload();
            counters.reload();
          }}
        />
      ) : null}
    </div>
  );
}
