import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { relativeTime } from '@/domain/incident';
import type { OperatorNotification } from '@/notifications/notifications';
import { useNotifications } from '@/notifications/notifications-context';
import { Icon } from '@/ui/badges';
import { Pagination } from '@/ui/pagination';

import './notifications.css';

type Tab = 'all' | 'unread' | 'duplicates';
const PAGE_SIZE = 10;

const TONES: Record<OperatorNotification['tone'], { color: string; background: string; border: string }> = {
  warning: { color: '#b45309', background: '#fffbeb', border: '#fcd9a5' },
  danger: { color: '#ba1a1a', background: '#ffe4e1', border: '#f6c2bd' },
};

/** Pantalla 9 de Figma: "Notificaciones". */
export function NotificationsPage() {
  const { notifications, unread: unreadCount, total, markRead, markAllRead, loading } = useNotifications();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [today] = useState(() => new Date().toDateString());

  const unread = notifications.filter((notification) => !notification.read);
  const newToday = unread.filter((notification) => new Date(notification.at).toDateString() === today).length;
  const needle = query.trim().toLowerCase();
  const shown = notifications
    .filter((notification) => {
      if (tab === 'unread') return !notification.read;
      if (tab === 'duplicates') return notification.duplicates > 0;
      return true;
    })
    .filter((notification) => !needle || [notification.code, notification.title, notification.highlight, notification.tag].some((value) => value?.toLowerCase().includes(needle)));
  const pageItems = shown.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function open(notification: OperatorNotification) {
    markRead(notification.id);
    navigate(`/incidencias/${notification.incidentId}`);
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'Todas', count: total },
    { key: 'unread', label: 'No leídas', count: unreadCount },
    { key: 'duplicates', label: 'Posibles duplicados' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">
            <Link to="/">Inicio</Link> <span>›</span> <span style={{ color: 'var(--text-strong)' }}>Notificaciones Operativas</span>
          </div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-sub">Alertas y actualizaciones de las incidencias</p>
        </div>
        <div className="page-actions">
          <span className="chip notif-today">
            <Icon name="bolt" size={16} /> {newToday} nuevas alertas hoy
          </span>
          <button className="btn btn-outline notif-markall" onClick={markAllRead} disabled={unreadCount === 0}>
            <Icon name="done_all" />
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="card notif-tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? 'notif-tab on' : 'notif-tab'}
            onClick={() => {
              setTab(item.key);
              setPage(0);
            }}
          >
            {item.label}
            {item.count !== undefined ? <span className="count">{item.count}</span> : null}
          </button>
        ))}
        <span className="input-icon notif-filter">
          <Icon name="filter_list" />
          <input
            className="input"
            placeholder="Filtrar por código o palabra clave…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </span>
      </div>

      <div className="notif-list">
        {loading && notifications.length === 0 ? <p className="empty">Cargando notificaciones…</p> : null}
        {!loading && pageItems.length === 0 ? <p className="card empty">No hay notificaciones en esta vista.</p> : null}
        {pageItems.map((notification) => {
          const tone = TONES[notification.tone];
          const fresh = !notification.read;
          return (
            <div key={notification.id} className="card notif-row">
              <span className="notif-icon" style={{ color: tone.color, background: tone.background, borderColor: tone.border }}>
                <Icon name={notification.duplicates > 0 ? 'content_copy' : 'warning'} />
              </span>
              <div className="notif-text">
                <div className="notif-title">
                  <strong>{notification.title}</strong>
                  <span className="tag" style={{ color: tone.color, background: tone.background, border: `1px solid ${tone.border}` }}>
                    {notification.tag}
                  </span>
                </div>
                <div className="notif-line">
                  <span className="mono notif-code">{notification.code}</span> {notification.message} <strong>{notification.highlight}</strong>
                </div>
              </div>
              <span className="mono notif-time">{relativeTime(notification.at)}</span>
              {fresh ? <span className="notif-dot" title="No leída" /> : <Icon name="check" size={18} style={{ color: 'var(--text-muted)' }} />}
              <button className="btn btn-outline btn-sm notif-open" onClick={() => open(notification)}>
                {fresh ? (
                  <>
                    Ver detalle <Icon name="arrow_forward" size={16} />
                  </>
                ) : (
                  <>
                    Expediente <Icon name="open_in_new" size={16} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {shown.length > 0 ? (
        <div style={{ borderTop: '1px solid var(--border-faint)' }}>
          <Pagination page={page} size={PAGE_SIZE} total={shown.length} noun="notificaciones" onPage={setPage} />
        </div>
      ) : null}
      <p className="hint">Avisos de nuevos reportes de los ciudadanos (se muestran los 100 más recientes). Se actualizan cada minuto.</p>
    </div>
  );
}
