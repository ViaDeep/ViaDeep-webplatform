import { NavLink, Outlet } from 'react-router-dom';

import { useSession } from '@/session/session';

import './layout.css';

/** Secciones de la plataforma, una por pantalla web de Figma (2 a 10). */
const SECTIONS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/incidencias', label: 'Incidencias' },
  { to: '/mapa', label: 'Mapa SIG' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/notificaciones', label: 'Notificaciones' },
  { to: '/configuracion', label: 'Configuración' },
] as const;

export function AppLayout() {
  const { user, signOut } = useSession();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          ViaDeep <span className="mono">OPERADOR</span>
        </div>
        <nav>
          {SECTIONS.map((section) => (
            <NavLink key={section.to} to={section.to} end={'end' in section} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="account">
          <div className="account-name">{user?.fullName}</div>
          <div className="mono account-email">{user?.email}</div>
          <button className="btn btn-outline" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
