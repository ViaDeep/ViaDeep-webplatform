import type { CSSProperties } from 'react';

import { DISPLAY_STATUS_LABELS, SEVERITY_LABELS, displayStatus, type IncidentStatus, type Severity } from '@/domain/incident';

import { SEVERITY_COLORS, STATUS_COLORS } from './colors';

export function StatusBadge({ status, severity }: { status: IncidentStatus; severity: Severity | null }) {
  const shown = displayStatus(status, severity);
  const tone = STATUS_COLORS[shown];
  return (
    <span className="badge" style={{ color: tone.text, background: tone.background, borderColor: tone.border }}>
      <span className="dot" style={{ background: tone.color }} />
      {DISPLAY_STATUS_LABELS[shown]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) return <span className="badge muted" style={{ borderColor: 'var(--border-faint)' }}>Sin evaluar</span>;
  const tone = SEVERITY_COLORS[severity];
  return (
    <span className="badge" style={{ color: tone.text, background: tone.background, borderColor: tone.border, fontWeight: 600 }}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function Icon({ name, fill = false, size, style }: { name: string; fill?: boolean; size?: number; style?: CSSProperties }) {
  return (
    <span className={fill ? 'ms fill' : 'ms'} aria-hidden="true" style={size ? { fontSize: size, ...style } : style}>
      {name}
    </span>
  );
}
