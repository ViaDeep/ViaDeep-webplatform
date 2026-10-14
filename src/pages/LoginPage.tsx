import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { errorMessage } from '@/api/http';
import { useSession } from '@/session/session';

import './login.css';

/** Pantalla 1 de Figma: "Login del Operador Municipal" (estructura provisional). */
export function LoginPage() {
  const { user, signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div>
          <div className="label">Municipalidad Metropolitana de Lima</div>
          <h1 className="page-title">ViaDeep · Operador</h1>
          <p className="page-sub">Ingresa con tu cuenta de operador municipal.</p>
        </div>
        <label className="field">
          <span>Correo institucional</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error ? <div className="error" role="alert">{error}</div> : null}
        <button className="btn btn-navy" type="submit" disabled={sending}>
          {sending ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
