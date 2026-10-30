import type { DisplayStatus, Severity } from '@/domain/incident';

/** Colores de cada estado en etiquetas, gráficos y marcadores del mapa. */
export const STATUS_COLORS: Record<DisplayStatus, { color: string; text: string; background: string; border: string }> = {
  REGISTERED: { color: 'var(--gray-dot)', text: 'var(--text-secondary)', background: '#f1f3f7', border: '#dfe3ee' },
  IN_REVIEW: { color: 'var(--orange)', text: 'var(--warning-text)', background: 'var(--warning-surface)', border: '#fcd9a5' },
  IN_PROGRESS: { color: 'var(--info)', text: 'var(--primary)', background: '#eef6ff', border: '#bcd8ff' },
  RESOLVED: { color: 'var(--success)', text: 'var(--success)', background: 'var(--success-surface)', border: '#b5e8d4' },
  REJECTED: { color: 'var(--danger-bright)', text: 'var(--danger)', background: 'var(--danger-surface)', border: '#f6c2bd' },
};

export const SEVERITY_COLORS: Record<Severity, { color: string; text: string; background: string; border: string }> = {
  HIGH: { color: 'var(--danger-bright)', text: 'var(--danger)', background: 'var(--danger-surface)', border: '#f6c2bd' },
  MEDIUM: { color: 'var(--orange)', text: '#c2410c', background: 'var(--orange-surface)', border: '#fcd0ad' },
  LOW: { color: 'var(--gray-dot)', text: 'var(--text-secondary)', background: '#f1f3f7', border: '#dfe3ee' },
};
