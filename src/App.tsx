import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layout/AppLayout';
import { AssignmentsPage } from '@/pages/AssignmentsPage';
import { ChangeTemporaryPasswordPage } from '@/pages/ChangeTemporaryPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { IncidentDetailPage } from '@/pages/IncidentDetailPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { LoginPage } from '@/pages/LoginPage';
import { MapPage } from '@/pages/MapPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SessionProvider, useSession } from '@/session/session';

function RequireOperator() {
  const { loading, user } = useSession();
  if (loading) return <p style={{ padding: 24 }}>Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  // Con contraseña temporal no se puede usar la plataforma hasta reemplazarla.
  return user.passwordChangeRequired ? <Navigate to="/cambiar-clave" replace /> : <Outlet />;
}

/** Solo el administrador gestiona las cuentas; un operador que entre a /usuarios vuelve a Configuración. */
function RequireAdministrator() {
  const { user } = useSession();
  return user?.administrator ? <Outlet /> : <Navigate to="/configuracion" replace />;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cambiar-clave" element={<ChangeTemporaryPasswordPage />} />
          <Route element={<RequireOperator />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="incidencias" element={<IncidentsPage />} />
              <Route path="incidencias/:id" element={<IncidentDetailPage />} />
              <Route path="mapa" element={<MapPage />} />
              <Route path="asignaciones" element={<AssignmentsPage />} />
              <Route path="estadisticas" element={<StatisticsPage />} />
              <Route element={<RequireAdministrator />}>
                <Route path="usuarios" element={<UsersPage />} />
              </Route>
              <Route path="notificaciones" element={<NotificationsPage />} />
              <Route path="configuracion" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
