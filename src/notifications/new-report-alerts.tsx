import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/ui/badges';

import { useNotifications } from './notifications-context';

import './new-report-alerts.css';

/** Tono corto al llegar un reporte. Si el navegador bloquea el audio, la alerta se ve igual. */
function chime() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
    oscillator.onended = () => void context.close();
  } catch {
    // Sin audio disponible.
  }
}

/** Alerta emergente de cada reporte nuevo que llega mientras el operador tiene la plataforma abierta. */
export function NewReportAlerts() {
  const { alerts, dismissAlert, markRead } = useNotifications();
  const navigate = useNavigate();
  const shown = useRef(new Set<string>());

  useEffect(() => {
    const fresh = alerts.filter((alert) => !shown.current.has(alert.id));
    if (fresh.length === 0) return;
    fresh.forEach((alert) => shown.current.add(alert.id));
    chime();
  }, [alerts]);

  if (alerts.length === 0) return null;
  return (
    <div className="report-alerts" role="status" aria-live="polite">
      {alerts.map((alert) => (
        <div key={alert.id} className={`report-alert ${alert.tone}`}>
          <Icon name={alert.tone === 'danger' ? 'content_copy' : 'campaign'} />
          <div className="report-alert-body">
            <strong>{alert.tag}</strong>
            <span>
              {alert.message} {alert.highlight} · <span className="mono">#{alert.code}</span>
            </span>
          </div>
          <button
            className="btn btn-outline report-alert-open"
            onClick={() => {
              markRead(alert.id);
              dismissAlert(alert.id);
              navigate(`/incidencias/${alert.incidentId}`);
            }}
          >
            Ver
          </button>
          <button className="icon-btn" title="Cerrar" onClick={() => dismissAlert(alert.id)}>
            <Icon name="close" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
