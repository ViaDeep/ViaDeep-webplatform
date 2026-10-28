import { Link } from 'react-router-dom';

import { incidentApi } from '@/api/incident-api';
import { formatDate, INCIDENT_TYPES, lastDays, percent, relativeTime, type Statistics } from '@/domain/incident';
import { Icon } from '@/ui/badges';
import { DamageTypeLabel } from '@/ui/damage-help';
import { IncidentMap } from '@/ui/incident-map';
import { MARKER_LEGEND } from '@/ui/map-style';
import { StatusBreakdown } from '@/ui/status-breakdown';
import { useLoader } from '@/ui/use-loader';

import './dashboard.css';

const PERIOD_DAYS = 30;

/** Colores de las barras por tipo, como en el mockup (rojo, naranja, azul y gris). */
const TYPE_COLORS = ['#dc2626', '#f59e0b', '#0057c0', '#5b6577'];

async function loadDashboard() {
  const period = lastDays(PERIOD_DAYS);
  const week = lastDays(7);
  const previousWeekEnd = new Date();
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
  const previousWeek = lastDays(7, previousWeekEnd);
  const [stats, thisWeek, lastWeek, urgent, recent] = await Promise.all([
    incidentApi.statistics(period),
    incidentApi.statistics(week),
    incidentApi.statistics(previousWeek),
    incidentApi.search({ status: 'PENDING', severity: 'HIGH', size: 1, ...period }),
    incidentApi.search({ size: 100, ...period }),
  ]);
  return { period, stats, thisWeek: thisWeek.total, lastWeek: lastWeek.total, urgent: urgent.totalItems, recent: recent.items, loadedAt: new Date() };
}

/** Pantalla 2 de Figma: "Dashboard del Operador Municipal". */
export function DashboardPage() {
  const { data, error, reload } = useLoader(loadDashboard, 'dashboard', true);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Resumen de incidencias viales y gestión operativa metropolitana en tiempo real.</p>
        </div>
        <div className="page-actions">
          <div className="period-pill mono">
            <Icon name="schedule" />
            <span>Últimos {PERIOD_DAYS} días</span>
            {data ? (
              <span className="period-range">
                {formatDate(`${data.period.from}T12:00:00`)} - {formatDate(`${data.period.to}T12:00:00`)}
              </span>
            ) : null}
          </div>
          <button className="btn btn-outline" onClick={reload}>
            <Icon name="sync" />
            Actualizar datos
          </button>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {data ? <DashboardContent {...data} /> : !error ? <p className="muted">Cargando indicadores…</p> : null}
    </div>
  );
}

type Content = Awaited<ReturnType<typeof loadDashboard>>;

function trend(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? 'nuevo' : null;
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}% sem.`;
}

function DashboardContent({ stats, thisWeek, lastWeek, urgent, recent, loadedAt }: Content) {
  const count = (status: keyof Statistics['byStatus']) => stats.byStatus[status] ?? 0;
  const districts = Object.keys(stats.byDistrict).length;
  const weekTrend = trend(thisWeek, lastWeek);
  const resolved = count('RESOLVED');
  const aiValidated = recent.filter((incident) => incident.aiValidated).length;
  const latest = recent[0];

  return (
    <>
      <div className="grid-4">
        <div className="card kpi">
          <div className="kpi-head">
            Incidencias Totales
            <span className="kpi-icon" style={{ background: 'var(--surface-blue)', color: 'var(--navy)' }}>
              <Icon name="grid_view" />
            </span>
          </div>
          <div className="kpi-value">
            {stats.total.toLocaleString('es-PE')}
            {weekTrend ? (
              <span className="kpi-chip" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
                <Icon name="trending_up" size={14} /> {weekTrend}
              </span>
            ) : null}
          </div>
          <div className="kpi-foot">
            <span>Red vial de Lima Metropolitana</span>
            <span className="mono">{districts} Distritos</span>
          </div>
        </div>

        <div className="card kpi">
          <div className="kpi-head">
            Pendientes de revisión
            <span className="kpi-icon" style={{ background: 'var(--orange-surface)', color: 'var(--orange)' }}>
              <Icon name="pending_actions" />
            </span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--orange)' }}>
            {count('PENDING').toLocaleString('es-PE')}
            <span className="kpi-chip" style={{ background: 'var(--orange-surface)', color: '#c2410c' }}>
              Por validar
            </span>
          </div>
          <div className="kpi-foot">
            <span>Requieren validación manual</span>
            <span className="mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>
              Prioridad Alta: {urgent}
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="kpi-head">
            En proceso
            <span className="kpi-icon" style={{ background: 'var(--surface-blue)', color: 'var(--primary)' }}>
              <Icon name="engineering" />
            </span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary)' }}>
            {count('IN_PROGRESS').toLocaleString('es-PE')}
            <span className="kpi-chip" style={{ background: 'var(--info-surface)', color: 'var(--primary)' }}>
              {stats.assigned} Asignadas
            </span>
          </div>
          <div className="kpi-foot">
            <span>Cuadrillas y contratistas viales</span>
            <span className="mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Rechazadas: {count('REJECTED')}
            </span>
          </div>
        </div>

        <div className="card kpi">
          <div className="kpi-head">
            Resueltas
            <span className="kpi-icon" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
              <Icon name="check_circle" />
            </span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            {resolved.toLocaleString('es-PE')}
            <span className="kpi-chip" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
              {percent(resolved, stats.total)} Eficacia
            </span>
          </div>
          <div className="kpi-foot">
            <span>Atendidas en el periodo</span>
            <Link to="/incidencias?estado=RESOLVED" className="mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
              Ver lista
            </Link>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">
              <Icon name="donut_large" />
              Incidencias por estado
            </div>
            <span className="mono muted" style={{ fontSize: 11 }}>
              N={stats.total.toLocaleString('es-PE')}
            </span>
          </div>
          <StatusBreakdown stats={stats} />
          <div className="card-foot">
            <span>Última sincronización: {relativeTime(loadedAt.toISOString())}</span>
            <Link to="/estadisticas">Ver informe detallado</Link>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">
              <Icon name="bar_chart" />
              Incidencias por tipo
            </div>
            <span className="mono muted" style={{ fontSize: 11 }}>
              MODELO LMD-YOLO
            </span>
          </div>
          <div className="type-bars">
            {INCIDENT_TYPES.map((type, index) => {
              const value = stats.byType[type] ?? 0;
              return (
                <div key={type}>
                  <div className="type-bar-head">
                    <DamageTypeLabel type={type} />
                    <span className="mono">
                      <strong>{percent(value, stats.total).replace('.0%', '%')}</strong> ({value})
                    </span>
                  </div>
                  <div className="bar" style={{ height: 8 }}>
                    <span style={{ width: stats.total ? `${(value / stats.total) * 100}%` : 0, background: TYPE_COLORS[index] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card-foot">
            <span>
              Detectadas por IA en el celular:{' '}
              <strong className="mono" style={{ color: 'var(--success)' }}>
                {percent(aiValidated, recent.length)}
              </strong>
            </span>
            <Link to="/incidencias">Ver incidencias</Link>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">
              <Icon name="my_location" />
              Georreferenciación SIG
            </div>
            <span className="chip" style={{ height: 22, fontSize: 10 }}>
              Lima Metropolitana
            </span>
          </div>
          <div className="mini-map">
            <IncidentMap incidents={recent} interactive={false} />
            {latest ? (
              <div className="mini-map-coords mono">
                LAT: {latest.latitude.toFixed(4)} | LON: {latest.longitude.toFixed(4)}
              </div>
            ) : null}
          </div>
          <div className="card-foot">
            <span className="map-legend">
              {MARKER_LEGEND.slice(0, 4).map((item) => (
                <span key={item.key}>
                  <span className="dot" style={{ background: item.color }} />
                  {item.label.split(' / ')[0]}
                </span>
              ))}
            </span>
            <Link to="/mapa" style={{ whiteSpace: 'nowrap' }}>
              Abrir Mapa SIG
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
