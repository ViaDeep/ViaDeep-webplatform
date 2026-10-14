import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { connectionStore } from '@/api/http';
import { initials } from '@/domain/incident';
import { NotificationsProvider, useNotifications } from '@/notifications/notifications-context';
import { useSession } from '@/session/session';
import { Icon } from '@/ui/badges';
import { Logo } from '@/ui/logo';

import './layout.css';

type Section = { to: string; label: string; icon: string; end?: boolean; also?: string };

/** Menú lateral de los mockups web de Figma (pantallas 2 a 10). Usuarios vive dentro de Configuración. */
const SECTIONS: readonly Section[] = [
  { to: '/', label: 'Dashboard', icon: 'grid_view', end: true },
  { to: '/incidencias', label: 'Incidencias', icon: 'warning' },
  { to: '/mapa', label: 'Mapa SIG', icon: 'map' },
  { to: '/asignaciones', label: 'Asignaciones', icon: 'assignment_ind' },
  { to: '/estadisticas', label: 'Estadísticas', icon: 'analytics' },
  { to: '/notificaciones', label: 'Notificaciones', icon: 'notifications' },
  { to: '/configuracion', label: 'Configuración', icon: 'settings', also: '/usuarios' },
];

export function AppLayout() {
  return (
    <NotificationsProvider>
      <Shell />
    </NotificationsProvider>
  );
}

function useConnection() {
  return useSyncExternalStore(connectionStore.subscribe, connectionStore.get);
}

function Shell() {
  const { user, signOut } = useSession();
  const { unread } = useNotifications();
  const connection = useConnection();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/incidencias?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <Logo size={34} />
          <div>
            <div className="topbar-title">ViaDeep | Municipalidad Metropolitana de Lima</div>
            <div className="topbar-sub mono">SISTEMA INTEGRADO DE TELEMETRÍA VIAL</div>
          </div>
        </div>
        <form className="topbar-search input-icon" onSubmit={search} role="search">
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar por código de incidencia"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar por código de incidencia"
          />
        </form>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive || location.pathname !== '/mapa' ? 'tab active' : 'tab')}>
            Centro de Control
          </NavLink>
          <NavLink to="/mapa" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Monitoreo en Vivo
          </NavLink>
          <a className="tab" href="https://www.munlima.gob.pe/" target="_blank" rel="noreferrer">
            Normativa Vigente
          </a>
        </nav>
        <div className="topbar-right">
          <div className={connection.online ? 'net-pill' : 'net-pill off'} title="Estado de la conexión con el backend">
            <span className="dot" />
            <span className="mono">{connection.online ? 'EN LÍNEA' : 'SIN CONEXIÓN'}</span>
            {connection.online && connection.latencyMs !== null ? <span className="mono net-ms">{connection.latencyMs}ms</span> : null}
          </div>
          <button className="icon-btn" title="Mapa SIG" onClick={() => navigate('/mapa')}>
            <Icon name="dns" />
          </button>
          <button className="icon-btn" title="Notificaciones" onClick={() => navigate('/notificaciones')}>
            <Icon name="notifications" />
            {unread > 0 ? <span className="bell-dot" /> : null}
          </button>
          <button className="icon-btn" title="Configuración" onClick={() => navigate('/configuracion')}>
            <Icon name="tune" />
          </button>
          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>{user?.fullName}</strong>
              <span className="mono">Operador municipal</span>
            </div>
            <span className="avatar">{initials(user?.fullName ?? '')}</span>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="org">
          <span className="org-icon">
            <Icon name="location_city" />
          </span>
          <div>
            <div className="org-name">ViaDeep Telemetría</div>
            <div className="org-sub mono">Lima Metropolitana · MML</div>
          </div>
        </div>
        <nav className="side-nav">
          {SECTIONS.map((section) => {
            const alsoActive = section.also !== undefined && location.pathname.startsWith(section.also);
            return (
              <NavLink
                key={section.to}
                to={section.to}
                end={section.end}
                className={({ isActive }) => (isActive || alsoActive ? 'side-item active' : 'side-item')}
              >
                <Icon name={section.icon} />
                <span>{section.label}</span>
                {section.to === '/notificaciones' && unread > 0 ? <span className="count side-count">{unread}</span> : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="side-bottom">
          <div className="side-item static">
            <Icon name="settings_input_antenna" style={{ color: connection.online ? 'var(--success)' : 'var(--danger)' }} />
            <span>Estado de Red</span>
            <span className={connection.online ? 'chip net-chip' : 'chip net-chip off'}>{connection.online ? 'Activo' : 'Sin conexión'}</span>
          </div>
          <button className="side-item logout" onClick={signOut}>
            <Icon name="logout" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
