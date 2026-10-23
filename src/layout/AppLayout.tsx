import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { connectionStore } from '@/api/http';
import { initials } from '@/domain/incident';
import { NewReportAlerts } from '@/notifications/new-report-alerts';
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
  // En tablet y celular el menú lateral es un panel que se abre con el botón de la barra superior.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/incidencias?q=${encodeURIComponent(value)}`);
    closeMenu();
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
        <div className="topbar-brand">
          <Logo size={34} />
          <div>
            <div className="topbar-title">
              ViaDeep<span className="topbar-title-org"> | Municipalidad Metropolitana de Lima</span>
            </div>
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
          <button className="icon-btn" title="Notificaciones" onClick={() => navigate('/notificaciones')}>
            <Icon name="notifications" />
            {unread > 0 ? <span className="bell-dot" /> : null}
          </button>
          <button className="icon-btn topbar-extra" title="Configuración" onClick={() => navigate('/configuracion')}>
            <Icon name="tune" />
          </button>
          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>{user?.fullName}</strong>
              <span className="mono">{user?.administrator ? 'Administrador' : 'Operador municipal'}</span>
            </div>
            <span className="avatar">{initials(user?.fullName ?? '')}</span>
          </div>
        </div>
      </header>

      {menuOpen ? <div className="sidebar-backdrop" onClick={closeMenu} aria-hidden="true" /> : null}
      <aside id="sidebar" className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <form className="sidebar-search input-icon" onSubmit={search} role="search">
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar por código de incidencia"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar por código de incidencia"
          />
        </form>
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
                onClick={closeMenu}
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
          <a className="side-item side-link" href="https://www.munlima.gob.pe/" target="_blank" rel="noreferrer">
            <Icon name="gavel" />
            <span>Normativa Vigente</span>
          </a>
          <button className="side-item logout" onClick={signOut}>
            <Icon name="logout" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main">
        {connection.online ? null : (
          <div className="offline-banner" role="alert">
            <Icon name="cloud_off" size={18} />
            Sin conexión con el servidor. Los datos se actualizarán cuando vuelva.
          </div>
        )}
        <Outlet />
      </main>
      <NewReportAlerts />
    </div>
  );
}
