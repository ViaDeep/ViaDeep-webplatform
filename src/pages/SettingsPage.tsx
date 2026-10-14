import { useState } from 'react';
import { Link } from 'react-router-dom';

import { authApi } from '@/api/auth-api';
import { errorMessage, http } from '@/api/http';
import { formatTime, initials, relativeTime } from '@/domain/incident';
import { useNotifications } from '@/notifications/notifications-context';
import { useSession } from '@/session/session';
import { Icon } from '@/ui/badges';
import { useLoader } from '@/ui/use-loader';

import './settings.css';

/** Navegador y sistema operativo de esta sesión, a partir del user agent. */
function describeBrowser(agent: string): string {
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Navegador';
  const os = /Windows/.test(agent) ? 'Windows' : /Mac OS X/.test(agent) ? 'macOS' : /Android/.test(agent) ? 'Android' : /Linux/.test(agent) ? 'Linux' : 'otro sistema';
  return `Navegador ${browser} en ${os}`;
}

type ServiceState = { name: string; up: boolean };

/** Comprueba que respondan los tres microservicios (un 404 también cuenta como "responde"). */
async function checkServices(): Promise<{ services: ServiceState[]; checkedAt: Date }> {
  const probe = async (name: string, url: string) => {
    try {
      await http.get(url);
      return { name, up: true };
    } catch (error) {
      const status = (error as { response?: { status: number } }).response?.status;
      return { name, up: status !== undefined && status < 500 };
    }
  };
  const services = await Promise.all([
    probe('Autenticación', '/auth/me'),
    probe('Incidencias', '/incidents?size=1'),
    probe('Evidencias', '/evidences/00000000-0000-0000-0000-000000000000/url'),
  ]);
  return { services, checkedAt: new Date() };
}

/** Pantalla 10 de Figma: "Configuración". */
export function SettingsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">
            <Link to="/">Inicio</Link> <span>›</span> <strong>Configuración del Sistema</strong>
          </div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub">Administra tus preferencias de cuenta, seguridad y parámetros generales del operador.</p>
        </div>
        <div className="page-actions">
          <span className="chip settings-verified">
            <Icon name="verified_user" size={14} /> Sesión Verificada
          </span>
          <Link to="/usuarios" className="btn btn-navy">
            <Icon name="group" />
            Gestión de usuarios
          </Link>
        </div>
      </div>
      <div className="grid-2 settings-grid">
        <ProfileCard />
        <SecurityCard />
        <PreferencesCard />
        <SystemCard />
      </div>
    </div>
  );
}

function ProfileCard() {
  const { user, updateUser } = useSession();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [documentNumber, setDocumentNumber] = useState(user?.documentNumber ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = fullName.trim() !== (user?.fullName ?? '') || phone !== (user?.phone ?? '') || documentNumber !== (user?.documentNumber ?? '');

  function reset() {
    setFullName(user?.fullName ?? '');
    setPhone(user?.phone ?? '');
    setDocumentNumber(user?.documentNumber ?? '');
    setMessage(null);
  }

  async function save() {
    if (!fullName.trim()) {
      setMessage({ ok: false, text: 'El nombre no puede quedar vacío.' });
      return;
    }
    if (phone && !/^9\d{8}$/.test(phone)) {
      setMessage({ ok: false, text: 'El celular debe tener 9 dígitos y empezar con 9.' });
      return;
    }
    if (documentNumber && !/^\d{8}$/.test(documentNumber)) {
      setMessage({ ok: false, text: 'El DNI debe tener 8 dígitos.' });
      return;
    }
    setSaving(true);
    try {
      updateUser(await authApi.updateProfile({ fullName, phone, documentNumber }));
      setMessage({ ok: true, text: 'Perfil actualizado.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card settings-card">
      <div className="card-head">
        <div>
          <div className="card-title">
            <Icon name="badge" />
            Perfil del Operador
          </div>
          <div className="card-sub">Información de identidad y asignación municipal del usuario activo</div>
        </div>
        <span className="tag" style={{ background: 'var(--surface-blue)', color: 'var(--primary)' }}>
          {user?.enabled === false ? 'INACTIVO' : 'ACTIVO'}
        </span>
      </div>
      <div className="settings-avatar-row">
        <span className="settings-avatar">{initials(user?.fullName ?? '')}</span>
        <div>
          <strong>{user?.fullName}</strong>
          <span className="mono muted">Cuenta creada {user?.createdAt ? relativeTime(user.createdAt).toLowerCase() : ''}</span>
        </div>
      </div>
      <div className="settings-form">
        <label className="field">
          <span className="label">Nombre completo</span>
          <span className="input-icon right">
            <input className="input" value={fullName} maxLength={120} onChange={(event) => setFullName(event.target.value)} />
            <Icon name="person" />
          </span>
        </label>
        <label className="field">
          <span className="label">Correo institucional</span>
          <span className="settings-inline">
            <span className="input-icon right" style={{ flex: 1 }}>
              <input className="input" value={user?.email ?? ''} readOnly />
              <Icon name="mail" />
            </span>
            <span className="tag settings-fixed">No editable</span>
          </span>
        </label>
        <div className="settings-two">
          <label className="field">
            <span className="label">Rol en plataforma</span>
            <span className="settings-role">
              Operador municipal <Icon name="shield_person" size={18} fill />
            </span>
          </label>
          <label className="field">
            <span className="label">Ámbito</span>
            <input className="input" value="Lima Metropolitana" readOnly />
          </label>
        </div>
        <div className="settings-two">
          <label className="field">
            <span className="label">Celular</span>
            <input className="input" inputMode="numeric" maxLength={9} placeholder="987654321" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="field">
            <span className="label">DNI</span>
            <input className="input" inputMode="numeric" maxLength={8} placeholder="12345678" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
        {message ? <p className={message.ok ? 'success-text' : 'error'}>{message.text}</p> : null}
      </div>
      <div className="settings-actions">
        <button className="btn btn-outline" onClick={reset} disabled={!changed}>
          Cancelar
        </button>
        <button className="btn btn-navy" onClick={() => void save()} disabled={!changed || saving}>
          <Icon name="save" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </section>
  );
}

function SecurityCard() {
  const { user, signOut } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function change() {
    if (!current || !next) {
      setMessage({ ok: false, text: 'Completa la contraseña actual y la nueva.' });
      return;
    }
    if (next.length < 8) {
      setMessage({ ok: false, text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (next !== confirm) {
      setMessage({ ok: false, text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setMessage({ ok: true, text: 'Contraseña actualizada. Úsala la próxima vez que inicies sesión.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card settings-card">
      <div className="card-head">
        <div>
          <div className="card-title">
            <Icon name="lock_reset" />
            Seguridad
          </div>
          <div className="card-sub">Protección de credenciales y acceso a la plataforma.</div>
        </div>
        {user?.lastLoginAt ? (
          <span className="chip settings-last mono">
            <Icon name="history" size={14} /> Último ingreso: {relativeTime(user.lastLoginAt)}
          </span>
        ) : null}
      </div>
      <h3 className="settings-subtitle">Cambiar Contraseña</h3>
      <div className="settings-form">
        <label className="field">
          <span className="label">Contraseña actual</span>
          <span className="input-icon right">
            <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
            <button type="button" className="icon-btn settings-eye" onClick={() => setShow((value) => !value)} aria-label={show ? 'Ocultar' : 'Mostrar'}>
              <Icon name={show ? 'visibility_off' : 'visibility'} />
            </button>
          </span>
        </label>
        <div className="settings-two">
          <label className="field">
            <span className="label">Nueva contraseña</span>
            <input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={next} onChange={(event) => setNext(event.target.value)} />
          </label>
          <label className="field">
            <span className="label">Confirmar nueva contraseña</span>
            <input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Repite la contraseña" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </label>
        </div>
        {message ? <p className={message.ok ? 'success-text' : 'error'}>{message.text}</p> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-soft" onClick={() => void change()} disabled={saving}>
            <Icon name="key" />
            {saving ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>
      <h3 className="settings-subtitle settings-session-title">
        Sesión Activa <span className="dot" style={{ background: 'var(--success)' }} />
      </h3>
      <div className="settings-session">
        <span className="settings-session-icon">
          <Icon name="laptop" />
        </span>
        <div style={{ flex: 1 }}>
          <strong>{describeBrowser(navigator.userAgent)}</strong>
          <span className="mono muted">
            {window.location.host} · Lima Metropolitana
          </span>
        </div>
        <button className="btn settings-logout" onClick={signOut}>
          <Icon name="logout" size={18} />
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}

function PreferencesCard() {
  const { preferences, setPreferences } = useNotifications();
  const [onScreen, setOnScreen] = useState(preferences.onScreen);
  const [saved, setSaved] = useState(false);
  return (
    <section className="card settings-card">
      <div className="card-head">
        <div>
          <div className="card-title">
            <Icon name="tune" />
            Preferencias
          </div>
          <div className="card-sub">Canales de notificación y visualización de la consola.</div>
        </div>
      </div>
      <div className="settings-pref">
        <div>
          <strong>
            <Icon name="notifications_active" size={18} /> Recibir notificaciones en pantalla
          </strong>
          <p>Muestra el contador y el aviso de la campana cuando llegan reportes nuevos, asignaciones o cambios de estado.</p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={onScreen}
            onChange={(event) => {
              setOnScreen(event.target.checked);
              setSaved(false);
            }}
          />
          <span />
        </label>
      </div>
      <div className="settings-pref disabled">
        <div>
          <strong>
            <Icon name="mail" size={18} /> Notificaciones por correo institucional
          </strong>
          <p>Disponible cuando se active el servicio de notificaciones del backend.</p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={false} disabled readOnly />
          <span />
        </label>
      </div>
      <label className="field" style={{ marginTop: 6 }}>
        <span className="label">Idioma del entorno operativo</span>
        <select className="select" disabled>
          <option>Español (Perú - Predeterminado)</option>
        </select>
        <span className="mono muted" style={{ fontSize: 11 }}>
          Afecta reportes exportables y nomenclaturas técnicas oficiales.
        </span>
      </label>
      <div className="settings-actions">
        {saved ? <span className="success-text">Preferencias guardadas.</span> : null}
        <button
          className="btn btn-navy"
          onClick={() => {
            setPreferences({ onScreen });
            setSaved(true);
          }}
        >
          <Icon name="check" />
          Guardar preferencias
        </button>
      </div>
    </section>
  );
}

function SystemCard() {
  const { data, reload } = useLoader(checkServices, 'services');
  const allUp = data?.services.every((service) => service.up) ?? false;
  return (
    <section className="card settings-card">
      <div className="card-head">
        <div>
          <div className="card-title">
            <Icon name="info" />
            Información del Sistema
          </div>
          <div className="card-sub">Detalles de la versión y del estado de los microservicios.</div>
        </div>
        <button className="icon-btn" onClick={reload} title="Volver a comprobar">
          <Icon name="published_with_changes" />
        </button>
      </div>
      <div className="settings-box settings-version">
        <div>
          <span className="label">Versión de plataforma</span>
          <strong>ViaDeep Plataforma de Operadores v{__APP_VERSION__}</strong>
        </div>
        <span className="chip">React · Vite</span>
      </div>
      <div className="settings-box">
        <div className="settings-status-head">
          <span className="label">Estado del sistema</span>
          {data ? (
            <span className={allUp ? 'chip settings-ok' : 'chip settings-bad'}>
              <span className="dot" /> {allUp ? 'Operativo y sincronizado' : 'Con servicios caídos'}
            </span>
          ) : (
            <span className="chip">Comprobando…</span>
          )}
        </div>
        <div className="settings-services">
          {(data?.services ?? []).map((service) => (
            <span key={service.name} className={service.up ? 'settings-service up' : 'settings-service down'}>
              <Icon name={service.up ? 'check_circle' : 'error'} size={16} /> {service.name}
            </span>
          ))}
        </div>
      </div>
      <div className="settings-two">
        <div className="settings-box">
          <span className="label">Última comprobación</span>
          <strong className="mono">{data ? `Hoy a las ${formatTime(data.checkedAt.toISOString())}` : '—'}</strong>
        </div>
        <div className="settings-box">
          <span className="label">Servidor</span>
          <strong className="mono">{window.location.host}</strong>
        </div>
      </div>
      <div className="settings-footer">
        <span>Detección de daños con LMD-YOLO en el celular del ciudadano · Microservicios Spring Boot</span>
        <span className="mono">© {data ? data.checkedAt.getFullYear() : ''} ViaDeep · Lima</span>
      </div>
    </section>
  );
}
