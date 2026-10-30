import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layout/AppLayout';
import { AssignmentsPage } from '@/pages/AssignmentsPage';
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
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireOperator />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="incidencias" element={<IncidentsPage />} />
              <Route path="incidencias/:id" element={<IncidentDetailPage />} />
              <Route path="mapa" element={<MapPage />} />
              <Route path="asignaciones" element={<AssignmentsPage />} />
              <Route path="estadisticas" element={<StatisticsPage />} />
              <Route path="usuarios" element={<UsersPage />} />
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
