import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { errorMessage } from '@/api/http';
import { evidenceApi, incidentApi } from '@/api/incident-api';
import {
  formatDateTime,
  nextStatuses,
  reportCode,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  type IncidentDetail,
  type IncidentStatus,
  type Severity,
} from '@/domain/incident';
import { SeverityBadge, StatusBadge } from '@/ui/badges';

/** Pantalla 4 de Figma: "Detalle y Gestión de Incidencia" (estructura provisional). */
export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const detail = await incidentApi.detail(id);
      setIncident(detail);
      setError(null);
      evidenceApi.signedUrl(detail.evidenceId).then(setPhoto).catch(() => setPhoto(null));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      setComment('');
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!incident) {
    return <section>{error ? <p className="error">{error}</p> : <p>Cargando…</p>}</section>;
  }

  const targets = nextStatuses(incident.status);

  return (
    <section>
      <Link to="/incidencias">← Volver a incidencias</Link>
      <h1 className="page-title" style={{ marginTop: 12 }}>
        <span className="mono">{reportCode(incident.id, incident.createdAt)}</span> · {TYPE_LABELS[incident.type]}
      </h1>
      <p className="page-sub">
        {incident.district ?? 'Sin distrito'} · {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)} · {formatDateTime(incident.createdAt)}
      </p>
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="label">Evidencia</span>
          {photo ? <img src={photo} alt="Foto del daño" style={{ width: '100%', borderRadius: 6 }} /> : <p style={{ color: 'var(--text-muted)' }}>Foto no disponible.</p>}
          <div>
            {incident.aiValidated && incident.aiResult
              ? `Validado por IA · confianza ${(incident.aiResult.confidence * 100).toFixed(1)} %`
              : 'Reporte manual (sin validación de IA)'}
          </div>
          {incident.description ? <p style={{ margin: 0 }}>«{incident.description}»</p> : null}
          {incident.possibleDuplicates.length > 0 ? (
            <div>
              <span className="label">Posibles duplicados</span>
              <ul>
                {incident.possibleDuplicates.map((dup) => (
                  <li key={dup}><Link to={`/incidencias/${dup}`}>{dup.slice(0, 8)}</Link></li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="label">Gestión</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
          </div>

          <label className="field">
            <span>Prioridad</span>
            <select
              className="input"
              value={incident.severity ?? ''}
              disabled={saving}
              onChange={(e) => e.target.value && void run(() => incidentApi.assignSeverity(incident.id, e.target.value as Severity))}>
              <option value="" disabled>Asignar prioridad…</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
              ))}
            </select>
          </label>

          {targets.length > 0 ? (
            <>
              <label className="field">
                <span>Comentario para el ciudadano (opcional)</span>
                <textarea className="input" rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {targets.map((target: IncidentStatus) => (
                  <button
                    key={target}
                    className={target === 'REJECTED' ? 'btn btn-danger' : 'btn btn-primary'}
                    disabled={saving}
                    onClick={() => void run(() => incidentApi.changeStatus(incident.id, target, comment))}>
                    Pasar a «{STATUS_LABELS[target]}»
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Este reporte ya está cerrado.</p>
          )}

          <span className="label">Historial</span>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incident.history.map((entry, index) => (
              <li key={index}>
                <strong>{STATUS_LABELS[entry.toStatus]}</strong> · {formatDateTime(entry.changedAt)}
                {entry.comment ? <div style={{ color: 'var(--text-secondary)' }}>{entry.comment}</div> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
