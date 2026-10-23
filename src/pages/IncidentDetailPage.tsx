import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { userApi, type User } from '@/api/auth-api';
import { errorMessage } from '@/api/http';
import { evidenceApi, incidentApi } from '@/api/incident-api';
import { MUNICIPAL_AREAS } from '@/domain/assignment';
import {
  DISPLAY_STATUS_LABELS,
  displayStatus,
  formatDate,
  formatTime,
  nextStatuses,
  reportCode,
  SEVERITIES,
  SEVERITY_LABELS,
  TYPE_LABELS,
  type HistoryEntry,
  type IncidentDetail,
  type IncidentStatus,
  type Severity,
} from '@/domain/incident';
import { useSession } from '@/session/session';
import { AssignModal } from '@/ui/assign-modal';
import { Icon } from '@/ui/badges';
import { STATUS_COLORS } from '@/ui/colors';
import { OperatorSelect } from '@/ui/operator-select';
import { useLoader } from '@/ui/use-loader';

import './incident-detail.css';

const NEXT_STATUS_LABELS: Record<IncidentStatus, string> = {
  PENDING: 'Registrada / En revisión',
  IN_PROGRESS: 'En proceso (despacho de cuadrilla)',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada (reporte infundado)',
};

/** Nota que queda en el historial cuando el operador cambia el estado. */
const STATUS_NOTES: Record<IncidentStatus, string> = {
  PENDING: 'Reporte devuelto a revisión por el operador.',
  IN_PROGRESS: 'Reporte validado por el operador.',
  RESOLVED: 'Incidencia resuelta por el operador.',
  REJECTED: 'Reporte descartado por el operador.',
};

async function loadIncident(id: string) {
  const incident = await incidentApi.detail(id);
  const [photo, reporter] = await Promise.all([
    evidenceApi.signedUrl(incident.evidenceId).catch(() => null),
    userApi.get(incident.reporterId).catch((): User | null => null),
  ]);
  return { incident, photo, reporter };
}

/** Pantalla 4 de Figma: "Detalle y Gestión de Incidencia". */
export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const { data, error, reload } = useLoader(() => loadIncident(id), id);
  const [deriving, setDeriving] = useState(false);

  if (!data) {
    return <div className="page">{error ? <p className="error">{error}</p> : <p className="muted">Cargando expediente…</p>}</div>;
  }

  const { incident, photo, reporter } = data;
  const code = reportCode(incident.id, incident.createdAt);
  const shown = displayStatus(incident.status, incident.severity);
  const tone = STATUS_COLORS[shown];
  const closed = incident.status === 'RESOLVED' || incident.status === 'REJECTED';

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="crumbs">
            <Link to="/incidencias" className="back-link">
              <Icon name="arrow_back" size={16} /> Volver a Incidencias
            </Link>
            <span className="dot" style={{ width: 3, height: 3, background: 'var(--text-muted)' }} />
            <span>LIMA METROPOLITANA · FISCALIZACIÓN VIAL</span>
          </div>
          <div className="detail-title">
            <h1 className="page-title">Expediente #{code}</h1>
            <span className="status-pill" style={{ color: tone.text, background: tone.background, borderColor: tone.border }}>
              <span className="dot" style={{ background: tone.color }} />
              {DISPLAY_STATUS_LABELS[shown]}
            </span>
            {incident.severity ? <span className="chip priority-chip">Prioridad: {SEVERITY_LABELS[incident.severity]}</span> : null}
          </div>
          <div className="detail-meta">
            <span>
              <Icon name="calendar_today" size={16} /> Reportado: {formatDate(incident.createdAt)} · {formatTime(incident.createdAt)}
            </span>
            <span>
              <Icon name="smartphone" size={16} /> Origen: App ViaDeep ({incident.aiValidated ? 'detección con IA' : 'registro manual'})
            </span>
            <span>
              <Icon name="location_on" size={16} /> Distrito: {incident.district ?? 'Sin distrito'}
            </span>
          </div>
        </div>
        <div className="page-actions no-print">
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Icon name="print" />
            Imprimir Ficha
          </button>
          <button className="btn btn-outline" onClick={() => setDeriving(true)} disabled={closed}>
            <Icon name="share" />
            Derivar
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <EvidenceCard incident={incident} photo={photo} />
        <TechnicalCard incident={incident} reporter={reporter} />
        <ActionsCard key={incident.updatedAt} incident={incident} onSaved={reload} />
      </div>

      <Timeline incident={incident} />

      {deriving ? (
        <AssignModal
          incident={incident}
          onClose={() => setDeriving(false)}
          onAssigned={() => {
            setDeriving(false);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function EvidenceCard({ incident, photo }: { incident: IncidentDetail; photo: string | null }) {
  const [showAi, setShowAi] = useState(true);
  const ai = incident.aiResult;
  return (
    <section className="card evidence">
      <div className="evidence-head">
        <div className="card-title" style={{ fontSize: 15 }}>
          <Icon name="center_focus_strong" />
          Evidencia Pericial Fotográfica
        </div>
        <span className="tag" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
          APP · {incident.district ?? 'LIMA'}
        </span>
      </div>
      <div className="evidence-photo">
        {photo ? <img src={photo} alt={`Foto del reporte ${reportCode(incident.id, incident.createdAt)}`} /> : <div className="evidence-empty">Foto no disponible</div>}
        {photo && ai && showAi ? (
          <div
            className="bbox"
            style={{ left: `${ai.bboxX * 100}%`, top: `${ai.bboxY * 100}%`, width: `${ai.bboxWidth * 100}%`, height: `${ai.bboxHeight * 100}%` }}
          >
            <span className="bbox-label mono">
              {TYPE_LABELS[incident.type].toUpperCase()} | {(ai.confidence * 100).toFixed(1)}%
            </span>
            <span className="bbox-center" />
          </div>
        ) : null}
        {photo ? (
          <div className="evidence-tools">
            {ai ? (
              <button className={showAi ? 'evidence-btn on' : 'evidence-btn'} onClick={() => setShowAi((value) => !value)}>
                <Icon name="visibility" size={16} /> {showAi ? 'Ver con detección IA' : 'Ver foto original'}
              </button>
            ) : null}
            <a className="evidence-btn icon" href={photo} target="_blank" rel="noreferrer" title="Abrir en tamaño completo">
              <Icon name="fullscreen" size={18} />
            </a>
          </div>
        ) : null}
        <div className="evidence-gps mono">
          GPS: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)} · {new Date(incident.createdAt).toLocaleString('sv-SE', { timeZone: 'America/Lima' })} UTC-5
        </div>
      </div>
      <div className="evidence-foot mono">
        <span>
          <Icon name="verified" size={16} /> Captura georreferenciada desde la app · Fecha y hora registradas por el servidor
        </span>
      </div>
    </section>
  );
}

function TechnicalCard({ incident, reporter }: { incident: IncidentDetail; reporter: User | null }) {
  const ai = incident.aiResult;
  const confidence = ai ? ai.confidence * 100 : null;
  return (
    <section className="card technical">
      <div className="technical-body">
        <div className="card-title" style={{ fontSize: 15, alignItems: 'flex-start' }}>
          <Icon name="fact_check" />
          <span style={{ flex: 1 }}>Datos Técnicos del Reporte</span>
          <span className="mono muted" style={{ fontSize: 10 }}>
            ID {incident.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <Item label="Tipo de incidencia">{TYPE_LABELS[incident.type]}</Item>
        <Item label="Nivel de confianza IA">
          {confidence !== null ? (
            <div className="confidence">
              <span className="confidence-box mono">
                <Icon name="check_circle" size={16} /> {confidence.toFixed(1)}% {confidence >= 80 ? 'Alta fiabilidad' : confidence >= 50 ? 'Fiabilidad media' : 'Baja fiabilidad'}
              </span>
              <span className="mono muted" style={{ fontSize: 11 }}>
                LMD-YOLO
              </span>
            </div>
          ) : (
            <span className="muted">Registro manual (sin detección IA)</span>
          )}
        </Item>
        <Item label="Fecha y hora de registro">
          {new Date(incident.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })} · {formatTime(incident.createdAt)}
        </Item>
        <Item label="Coordenadas geodésicas">
          <div className="coords">
            <span className="mono">
              {incident.latitude.toFixed(6)},<br />
              {incident.longitude.toFixed(6)}
            </span>
            <Link to={`/mapa?foco=${incident.id}`}>
              <Icon name="open_in_new" size={16} /> Ver en mapa
            </Link>
          </div>
        </Item>
        <Item label="Distrito">{incident.district ?? 'Sin distrito'}</Item>
        <Item label="Relato del ciudadano">
          {incident.description ? <blockquote className="quote">“{incident.description}”</blockquote> : <span className="muted">El ciudadano no dejó descripción.</span>}
        </Item>
        {incident.possibleDuplicates.length > 0 ? (
          <Item label="Posibles duplicados (menos de 15 m)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {incident.possibleDuplicates.map((duplicate) => (
                <Link key={duplicate} to={`/incidencias/${duplicate}`} className="mono" style={{ fontSize: 12 }}>
                  {duplicate.slice(0, 8).toUpperCase()} →
                </Link>
              ))}
            </div>
          </Item>
        ) : null}
      </div>
      <div className="reporter">
        <div>
          <span className="mono muted" style={{ fontSize: 11 }}>
            Reportante
          </span>
          <strong>{reporter?.fullName ?? 'Ciudadano registrado'}</strong>
        </div>
        {reporter?.documentNumber ? (
          <span className="tag reporter-dni">
            <Icon name="verified_user" size={14} /> DNI registrado
          </span>
        ) : null}
      </div>
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="item">
      <span className="label">{label}</span>
      <div className="item-value">{children}</div>
    </div>
  );
}

function ActionsCard({ incident, onSaved }: { incident: IncidentDetail; onSaved: () => void }) {
  const closed = incident.status === 'RESOLVED' || incident.status === 'REJECTED';
  return (
    <div className="actions-stack no-print">
      <EvaluationCard incident={incident} closed={closed} onSaved={onSaved} />
      <AssignmentCard incident={incident} closed={closed} onSaved={onSaved} />
      {closed ? <p className="muted" style={{ fontSize: 13 }}>Este expediente está cerrado; ya no admite cambios.</p> : null}
    </div>
  );
}

function useSaver(onSaved: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function run(steps: (() => Promise<void>)[]) {
    setSaving(true);
    setError(null);
    try {
      for (const step of steps) await step();
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }
  return { error, setError, saving, run };
}

/** Qué tan grave es el daño y en qué etapa está el reporte. */
function EvaluationCard({ incident, closed, onSaved }: { incident: IncidentDetail; closed: boolean; onSaved: () => void }) {
  const [severity, setSeverity] = useState<Severity | ''>(incident.severity ?? '');
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const { error, setError, saving, run } = useSaver(onSaved);
  const options = [incident.status, ...nextStatuses(incident.status)];

  function save() {
    const steps: (() => Promise<void>)[] = [];
    if (severity && severity !== incident.severity) steps.push(() => incidentApi.assignSeverity(incident.id, severity));
    if (status !== incident.status) {
      if (status === 'REJECTED' && !window.confirm('¿Rechazar este reporte como infundado? El ciudadano verá el estado "Rechazado".')) return;
      steps.push(() => incidentApi.changeStatus(incident.id, status, STATUS_NOTES[status]));
    }
    if (steps.length === 0) {
      setError('No hay cambios por guardar.');
      return;
    }
    void run(steps);
  }

  return (
    <section className="card card-pad actions">
      <div className="card-title" style={{ fontSize: 15 }}>
        <Icon name="fact_check" />
        Evaluación del reporte
      </div>
      <p className="muted actions-help">Define qué tan grave es el daño y en qué etapa está. El ciudadano ve el cambio de estado en su app.</p>
      <fieldset disabled={closed || saving} className="actions-form">
        <label className="field">
          <span className="label">Nivel de severidad vial</span>
          <select className="select" value={severity} onChange={(event) => setSeverity(event.target.value as Severity)}>
            {!incident.severity ? <option value="">Sin evaluar</option> : null}
            {SEVERITIES.map((value) => (
              <option key={value} value={value}>
                {SEVERITY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Estado operativo</span>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus)}>
            {options.map((value) => (
              <option key={value} value={value}>
                {value === incident.status ? `${DISPLAY_STATUS_LABELS[displayStatus(value, incident.severity)]} (estado actual)` : NEXT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="button" className="btn btn-navy" onClick={save}>
          <Icon name="save" />
          {saving ? 'Guardando…' : 'Guardar evaluación'}
        </button>
      </fieldset>
    </section>
  );
}

/** Quién atiende el reporte, de qué área y con qué indicaciones. */
function AssignmentCard({ incident, closed, onSaved }: { incident: IncidentDetail; closed: boolean; onSaved: () => void }) {
  const { user } = useSession();
  const [assignee, setAssignee] = useState(incident.assignee ?? '');
  const [area, setArea] = useState(incident.assignedArea ?? '');
  const [notes, setNotes] = useState('');
  const { error, setError, saving, run } = useSaver(onSaved);

  function save() {
    const changed = assignee.trim() !== (incident.assignee ?? '') || area !== (incident.assignedArea ?? '') || notes.trim() !== '';
    if (!changed) {
      setError('No hay cambios por guardar.');
      return;
    }
    if (!assignee.trim() || !area) {
      setError('Elige el responsable y el área municipal.');
      return;
    }
    void run([() => incidentApi.assign(incident.id, { assignee, area, note: notes })]);
  }

  const areas = area && !MUNICIPAL_AREAS.includes(area as (typeof MUNICIPAL_AREAS)[number]) ? [area, ...MUNICIPAL_AREAS] : MUNICIPAL_AREAS;

  return (
    <section className="card card-pad actions">
      <div className="card-title" style={{ fontSize: 15 }}>
        <Icon name="engineering" />
        Asignación y seguimiento
      </div>
      <p className="muted actions-help">Indica quién atiende el reporte y desde qué área. Las observaciones quedan como nota de la asignación.</p>
      <fieldset disabled={closed || saving} className="actions-form">
        <label className="field">
          <span className="label">Responsable / cuadrilla asignada</span>
          <OperatorSelect value={assignee} onChange={setAssignee} emptyLabel="Sin asignar" />
        </label>
        <label className="field">
          <span className="label">Área municipal</span>
          <select className="select" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">Sin asignar</option>
            {areas.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Observaciones técnicas del operador</span>
          <textarea
            className="input"
            rows={4}
            maxLength={500}
            placeholder="Indicaciones para la cuadrilla (opcional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <span className="mono muted" style={{ fontSize: 11, textAlign: 'right' }}>
            Firmado por: {user?.fullName}
          </span>
        </label>
        {incident.assignmentNote ? (
          <div className="notice">
            <Icon name="sticky_note_2" />
            <span>
              <strong>Nota de asignación:</strong> {incident.assignmentNote}
            </span>
          </div>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button type="button" className="btn btn-navy" onClick={save}>
          <Icon name="save" />
          {saving ? 'Guardando…' : 'Guardar asignación'}
        </button>
      </fieldset>
    </section>
  );
}

type Step = { title: string; state: 'done' | 'current' | 'pending'; date: string | null; text: string; tone?: 'danger' };

function entryTo(history: HistoryEntry[], status: IncidentStatus): HistoryEntry | undefined {
  return history.find((entry) => entry.toStatus === status);
}

function steps(incident: IncidentDetail): Step[] {
  const stamp = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)}`;
  const progress = entryTo(incident.history, 'IN_PROGRESS');
  const resolved = entryTo(incident.history, 'RESOLVED');
  const rejected = entryTo(incident.history, 'REJECTED');
  const reviewed = incident.severity !== null || incident.status !== 'PENDING';
  const result: Step[] = [
    {
      title: '1. Registrada',
      state: 'done',
      date: stamp(incident.createdAt),
      text: `Reportado por ciudadano en la app móvil. ${incident.aiValidated ? 'Detección automática con LMD-YOLO en el celular.' : 'Registro manual del ciudadano.'}`,
    },
    {
      title: '2. En revisión',
      state: reviewed ? (incident.status === 'PENDING' ? 'current' : 'done') : 'current',
      date: null,
      text: incident.severity
        ? `Severidad asignada: ${SEVERITY_LABELS[incident.severity]}. Validación del operador municipal.`
        : 'Pendiente de que un operador valide el reporte y asigne la severidad.',
    },
  ];
  if (rejected) {
    result.push({ title: '3. Rechazada', state: 'done', tone: 'danger', date: stamp(rejected.changedAt), text: rejected.comment ?? 'Reporte descartado por el operador.' });
    return result;
  }
  result.push(
    {
      title: '3. En proceso',
      state: progress ? (incident.status === 'IN_PROGRESS' ? 'current' : 'done') : 'pending',
      date: progress ? stamp(progress.changedAt) : null,
      text: progress
        ? [incident.assignee ? `Asignada a ${incident.assignee}${incident.assignedArea ? ` (${incident.assignedArea})` : ''}.` : null, progress.comment].filter(Boolean).join(' ') ||
          'Atención en curso.'
        : incident.assignee
          ? `Asignada a ${incident.assignee}. Falta iniciar la atención.`
          : 'Despacho de cuadrilla para la reparación.',
    },
    {
      title: '4. Resuelta',
      state: resolved ? 'done' : 'pending',
      date: resolved ? stamp(resolved.changedAt) : null,
      text: resolved ? (resolved.comment ?? 'Reparación concluida.') : 'Cierre del expediente y aviso al ciudadano.',
    },
  );
  return result;
}

function Timeline({ incident }: { incident: IncidentDetail }) {
  return (
    <section className="card card-pad">
      <div className="card-head" style={{ borderBottom: 'none', marginBottom: 4 }}>
        <div className="card-title">
          <Icon name="timeline" />
          Línea Temporal y Trazabilidad del Expediente
        </div>
        <span className="mono muted" style={{ fontSize: 11 }}>
          Última actualización: {formatDate(incident.updatedAt)} · {formatTime(incident.updatedAt)}
        </span>
      </div>
      <div className="timeline">
        {steps(incident).map((step, index) => (
          <div key={step.title} className={`step ${step.state}${step.tone === 'danger' ? ' danger' : ''}`}>
            <div className="step-head">
              <span className="step-mark">{step.state === 'done' ? <Icon name={step.tone === 'danger' ? 'close' : 'check'} size={16} /> : index + 1}</span>
              <div>
                <div className="step-title">{step.title}</div>
                <div className="step-state mono">{step.state === 'done' ? 'COMPLETADA' : step.state === 'current' ? 'ETAPA ACTUAL' : 'PENDIENTE'}</div>
              </div>
            </div>
            {step.date ? <div className="step-date">{step.date}</div> : null}
            <p className="step-text">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
