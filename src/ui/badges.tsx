import { SEVERITY_LABELS, STATUS_LABELS, type IncidentStatus, type Severity } from '@/domain/incident';

const STATUS_TONES: Record<IncidentStatus, { color: string; background: string }> = {
  PENDING: { color: 'var(--warning-text)', background: 'var(--warning-surface)' },
  IN_PROGRESS: { color: 'var(--primary)', background: 'var(--surface-blue)' },
  RESOLVED: { color: 'var(--success)', background: 'var(--success-surface)' },
  REJECTED: { color: 'var(--danger)', background: 'var(--danger-surface)' },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span className="badge" style={{ color: tone.color, background: tone.background }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) return <span className="badge badge-muted">Sin asignar</span>;
  const color = severity === 'HIGH' ? 'var(--danger)' : severity === 'MEDIUM' ? 'var(--warning-text)' : 'var(--success)';
  return (
    <span className="badge" style={{ color, background: 'var(--surface-muted)' }}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
