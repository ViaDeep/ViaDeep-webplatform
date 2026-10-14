import { useState } from 'react';

import { errorMessage } from '@/api/http';
import { incidentApi } from '@/api/incident-api';
import { MUNICIPAL_AREAS } from '@/domain/assignment';
import { reportCode, SEVERITY_LABELS, TYPE_LABELS, type IncidentSummary } from '@/domain/incident';

import { Icon } from './badges';
import { Modal } from './modal';

type AssignModalProps = {
  incident: IncidentSummary;
  suggestions: string[];
  onClose: () => void;
  onAssigned: () => void;
};

/** Modal "Asignar Incidencia" de la pantalla 6 de Figma (también la usa "Derivar" en el detalle). */
export function AssignModal({ incident, suggestions, onClose, onAssigned }: AssignModalProps) {
  const [assignee, setAssignee] = useState(incident.assignee ?? '');
  const [area, setArea] = useState(incident.assignedArea ?? MUNICIPAL_AREAS[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const code = reportCode(incident.id, incident.createdAt);

  async function confirm() {
    if (!assignee.trim()) {
      setError('Indica el responsable técnico.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await incidentApi.assign(incident.id, { assignee, area, note });
      onAssigned();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  const areas = MUNICIPAL_AREAS.includes(area as (typeof MUNICIPAL_AREAS)[number]) ? MUNICIPAL_AREAS : [area, ...MUNICIPAL_AREAS];

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          <span className="chip" style={{ height: 24 }}>
            ID: {code.replace(/^REP-\d{4}-LM-/, 'REP-')}
          </span>
          {incident.assignee ? 'Reasignar Incidencia' : 'Asignar Incidencia'}
        </>
      }
      subtitle={`${TYPE_LABELS[incident.type]} - ${incident.district ?? 'Sin distrito'}${incident.severity ? ` (Severidad ${SEVERITY_LABELS[incident.severity]})` : ''}`}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-navy" onClick={() => void confirm()} disabled={saving}>
            <Icon name="check" />
            {saving ? 'Guardando…' : 'Confirmar asignación'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label modal-label">
          <Icon name="person" size={16} /> Responsable Técnico Asignado
        </span>
        <input
          className="input"
          list="assignee-suggestions"
          placeholder="Ej. Ing. Carlos Mendoza - Inspector Vial"
          value={assignee}
          maxLength={120}
          onChange={(event) => setAssignee(event.target.value)}
          autoFocus
        />
        <datalist id="assignee-suggestions">
          {suggestions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span className="field-label modal-label">
          <Icon name="domain" size={16} /> Área Municipal Encargada
        </span>
        <select className="select" value={area} onChange={(event) => setArea(event.target.value)}>
          {areas.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label modal-label">
          <Icon name="notes" size={16} /> Observación y Prioridad de Validación
        </span>
        <textarea
          className="input"
          rows={3}
          maxLength={500}
          placeholder="Indicaciones para el responsable (opcional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
    </Modal>
  );
}
