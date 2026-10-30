import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { connectionStore, errorMessage } from '@/api/http';
import { useSession } from '@/session/session';
import { Icon } from '@/ui/badges';
import { Logo } from '@/ui/logo';

import './login.css';

/** Pantalla 1 de Figma: "Login del Operador Municipal". */
export function LoginPage() {
  const { user, signIn } = useSession();
  const connection = useSyncExternalStore(connectionStore.subscribe, connectionStore.get);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (user) return <Navigate to={user.passwordChangeRequired ? '/cambiar-clave' : '/'} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await signIn(email, password, remember);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-org">
          <span className="login-org-icon">
            <Icon name="account_balance" />
          </span>
          <div>
            <div className="login-org-name">
              Municipalidad Metropolitana de Lima <span className="chip login-mml">MML</span>
            </div>
            <div className="login-org-sub">Subgerencia de Operaciones Viales · Gerencia de Movilidad Urbana</div>
          </div>
        </div>
        <div className="login-header-right">
          <span className="chip login-node">
            <span className="dot" style={{ background: connection.online ? 'var(--success)' : 'var(--danger-bright)' }} />
            CENTRO DE CONTROL : LIMA
          </span>
          <span className="mono login-secure">PORTAL DE ACCESO SEGURO</span>
        </div>
      </header>

      <main className="login-main">
        <form className="login-card card" onSubmit={submit}>
          <div className="login-brand">
            <Logo size={48} />
            <div>
              <div className="login-brand-name">
                Via<span>Deep</span>
              </div>
              <div className="mono login-brand-tag">ON-DEVICE SMART ROAD AI</div>
            </div>
          </div>
          <div className="login-strip mono">
            <Icon name="verified" size={16} />
            Municipalidad Metropolitana de Lima · Centro de Control
          </div>

          <div className="login-heading">
            <h1>Centro de Control Municipal</h1>
            <p>Gestión y monitoreo de incidencias viales</p>
          </div>

          <label className="field">
            <span className="field-label login-label">Correo institucional</span>
            <span className="input-icon">
              <Icon name="badge" />
              <input
                className="input login-input"
                type="email"
                autoComplete="username"
                placeholder="operador.vial@munlima.gob.pe"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label login-label">Contraseña</span>
            <span className="input-icon login-password">
              <Icon name="lock" />
              <input
                className="input login-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="icon-btn login-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            </span>
          </label>

          <div className="login-row">
            <label className="checkbox">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Mantener sesión iniciada
            </label>
            <button type="button" className="login-forgot" onClick={() => setForgot((value) => !value)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          {forgot ? (
            <div className="notice">
              <Icon name="support_agent" />
              <span>Las cuentas de operador las administra la municipalidad. Pide a un operador con acceso que restablezca tu cuenta desde Configuración › Usuarios.</span>
            </div>
          ) : null}

          {error ? <p className="error">{error}</p> : null}

          <button className="btn btn-navy btn-block login-submit" type="submit" disabled={sending}>
            <Icon name="login" />
            {sending ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <div className="login-legal">
            <Icon name="shield" />
            <div>
              <strong>Acceso exclusivo para personal autorizado</strong>
              <p>Solo pueden ingresar cuentas de operador municipal. Cada cambio de estado queda registrado en el historial de la incidencia con el operador que lo hizo.</p>
            </div>
          </div>
        </form>

        <div className="login-links mono">
          <span>
            <Icon name="headset_mic" size={16} /> Mesa de Ayuda Telemática (MML)
          </span>
          <span className="dot login-sep" />
          <a href="https://www.munlima.gob.pe/" target="_blank" rel="noreferrer">
            <Icon name="gavel" size={16} /> Normativa Vigente
          </a>
        </div>
      </main>

      <footer className="login-footer">
        <div className="login-footer-left">
          <span className={connection.online ? 'chip login-status' : 'chip login-status off'}>
            <span className="dot" />
            {connection.online ? 'Sistema En Línea' : 'Sin conexión'}
          </span>
          {connection.latencyMs !== null ? (
            <span>
              Latencia: <strong className="mono">{connection.latencyMs}ms</strong>
            </span>
          ) : null}
          <span className="login-footer-sep" />
          <span>
            Detección en el dispositivo: <span className="mono login-model">LMD-YOLO</span>
          </span>
        </div>
        <span className="mono login-footer-right">ViaDeep · Plataforma de operadores municipales · Lima, Perú</span>
      </footer>
    </div>
  );
}
