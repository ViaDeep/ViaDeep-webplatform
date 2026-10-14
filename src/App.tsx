import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { IncidentDetailPage } from '@/pages/IncidentDetailPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { LoginPage } from '@/pages/LoginPage';
import { PendingDesignPage } from '@/pages/PendingDesignPage';
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
              <Route path="mapa" element={<PendingDesignPage title="Mapa SIG" figmaScreen="5. Mapa SIG de Incidencias Viales" />} />
              <Route path="asignaciones" element={<PendingDesignPage title="Asignaciones" figmaScreen="6. Asignaciones" />} />
              <Route path="estadisticas" element={<PendingDesignPage title="Estadísticas" figmaScreen="7. Estadísticas" />} />
              <Route path="usuarios" element={<PendingDesignPage title="Usuarios" figmaScreen="8. Usuarios" />} />
              <Route path="notificaciones" element={<PendingDesignPage title="Notificaciones" figmaScreen="9. Notificaciones" />} />
              <Route path="configuracion" element={<PendingDesignPage title="Configuración" figmaScreen="10. Configuración" />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
