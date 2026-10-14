import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth-api';
import { errorMessage } from '@/api/http';
import { useSession } from '@/session/session';
import { Icon } from '@/ui/badges';
import { Logo } from '@/ui/logo';

import './login.css';

/**
 * Primer ingreso de un operador dado de alta por otro: la contraseña que recibió es temporal y debe reemplazarla
 * antes de usar la plataforma. Usa el mismo estilo que la pantalla de login.
 */
export function ChangeTemporaryPasswordPage() {
  const { user, updateUser, signOut } = useSession();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.passwordChangeRequired) return <Navigate to="/" replace />;
  const account = user;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (next === current) {
      setError('La nueva contraseña debe ser distinta de la temporal.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await authApi.changePassword(current, next);
      updateUser({ ...account, passwordChangeRequired: false });
      navigate('/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <div className="login-page">
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

          <div className="login-heading">
            <h1>Crea tu contraseña</h1>
            <p>
              Hola, {account.fullName}. Tu cuenta se creó con una contraseña temporal. Elige una propia para continuar.
            </p>
          </div>

          <label className="field">
            <span className="field-label login-label">Contraseña temporal</span>
            <span className="input-icon">
              <Icon name="key" />
              <input
                className="input login-input"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                required
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label login-label">Nueva contraseña</span>
            <span className="input-icon">
              <Icon name="lock" />
              <input
                className="input login-input"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                required
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label login-label">Confirmar nueva contraseña</span>
            <span className="input-icon">
              <Icon name="lock" />
              <input
                className="input login-input"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} />
            Mostrar contraseñas
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn btn-navy btn-block login-submit" type="submit" disabled={saving}>
            <Icon name="check" />
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
          <button type="button" className="login-forgot" onClick={signOut}>
            Cerrar sesión
          </button>
        </form>
      </main>
    </div>
  );
}
