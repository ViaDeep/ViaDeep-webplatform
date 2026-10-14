import { useState } from 'react';
import { Link } from 'react-router-dom';

import { userApi, type Role, type User } from '@/api/auth-api';
import { errorMessage } from '@/api/http';
import { initials, relativeTime } from '@/domain/incident';
import { useSession } from '@/session/session';
import { Icon } from '@/ui/badges';
import { Modal } from '@/ui/modal';
import { Pagination } from '@/ui/pagination';
import { useLoader } from '@/ui/use-loader';

import './users.css';

const ROLE_LABELS: Record<Role, string> = { OPERATOR: 'Operador municipal', CITIZEN: 'Ciudadano' };
const PAGE_SIZE = 10;

type Filters = { q: string; role: string; enabled: string };

/** Pantalla 8 de Figma: "Usuarios" (Configuración › Gestión de Acceso). */
export function UsersPage() {
  const { user: me } = useSession();
  const [draft, setDraft] = useState<Filters>({ q: '', role: '', enabled: '' });
  const [filters, setFilters] = useState<Filters>(draft);
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useLoader(
    () =>
      userApi.search({
        q: filters.q,
        role: (filters.role || undefined) as Role | undefined,
        enabled: filters.enabled ? filters.enabled === 'true' : undefined,
        page,
        size: PAGE_SIZE,
      }),
    `${JSON.stringify(filters)}:${page}`,
  );
  const counts = useLoader(async () => {
    const [active, inactive] = await Promise.all([userApi.search({ enabled: true, size: 1 }), userApi.search({ enabled: false, size: 1 })]);
    return { active: active.totalItems, inactive: inactive.totalItems };
  }, 'counts');

  async function setEnabled(user: User, enabled: boolean) {
    if (!enabled && !window.confirm(`¿Desactivar la cuenta de ${user.fullName}? Ya no podrá iniciar sesión.`)) return;
    setBusyId(user.id);
    setActionError(null);
    try {
      await userApi.setEnabled(user.id, enabled);
      list.reload();
      counts.reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">
            <Link to="/configuracion">Configuración</Link> <span>/</span> <strong>Gestión de Acceso</strong>
          </div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">Administración de cuentas, credenciales y permisos institucionales</p>
        </div>
        <button className="btn btn-navy users-new" onClick={() => setCreating(true)}>
          <Icon name="person_add" />
          Nuevo usuario
        </button>
      </div>

      <form
        className="card users-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draft);
          setPage(0);
        }}
      >
        <span className="input-icon users-search">
          <Icon name="search" />
          <input className="input" placeholder="Buscar por nombre o correo" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} />
        </span>
        <select className="select users-select" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
          <option value="">Todos los roles</option>
          <option value="OPERATOR">Operadores municipales</option>
          <option value="CITIZEN">Ciudadanos</option>
        </select>
        <select className="select users-select" value={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.value })}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button className="btn btn-primary" type="submit">
          <Icon name="filter_alt" />
          Filtrar
        </button>
        <div className="users-summary mono">
          <span>{list.data ? `${list.data.totalItems} usuarios registrados` : '—'}</span>
          <span className="chip" style={{ background: 'var(--success-surface)', color: 'var(--success)' }}>
            <span className="dot" style={{ background: 'var(--success)', width: 6, height: 6 }} /> {counts.data?.active ?? '—'} activos
          </span>
          <span className="chip" style={{ background: '#f1f3f7', color: 'var(--text-secondary)' }}>
            <span className="dot" style={{ background: 'var(--gray-dot)', width: 6, height: 6 }} /> {counts.data?.inactive ?? '—'} inactivos
          </span>
        </div>
      </form>

      {actionError ? <p className="error">{actionError}</p> : null}
      {list.error ? <p className="error">{list.error}</p> : null}

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nombre &amp; cargo</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(list.data?.items ?? []).map((user) => (
                <tr key={user.id} className={user.enabled ? '' : 'user-off'}>
                  <td>
                    <span className="user-cell">
                      <span className={user.role === 'OPERATOR' ? 'user-avatar' : 'user-avatar citizen'}>{initials(user.fullName)}</span>
                      <span>
                        <strong>{user.fullName}</strong>
                        <small>{user.id === me?.id ? 'Tu cuenta' : user.documentNumber ? `DNI ${user.documentNumber}` : ROLE_LABELS[user.role]}</small>
                      </span>
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 13 }}>
                    {user.email}
                  </td>
                  <td>
                    <span className={user.role === 'OPERATOR' ? 'role-badge' : 'role-badge citizen'}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td>
                    <span className={user.enabled ? 'badge state-on' : 'badge state-off'}>
                      <span className="dot" /> {user.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {user.lastLoginAt ? relativeTime(user.lastLoginAt) : 'Nunca'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {user.enabled ? (
                      <button className="btn btn-outline btn-sm" disabled={user.id === me?.id || busyId === user.id} onClick={() => void setEnabled(user, false)}>
                        <Icon name="block" size={16} /> Desactivar
                      </button>
                    ) : (
                      <button className="btn btn-outline-primary btn-sm" disabled={busyId === user.id} onClick={() => void setEnabled(user, true)}>
                        <Icon name="check_circle" size={16} /> Activar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.data && list.data.items.length === 0 ? <p className="empty">No hay usuarios con estos filtros.</p> : null}
        </div>
        {list.data ? <Pagination page={page} size={PAGE_SIZE} total={list.data.totalItems} noun="usuarios registrados" onPage={setPage} /> : null}
      </div>

      {creating ? (
        <NewUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            list.reload();
            counts.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function NewUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!fullName.trim() || !email.trim()) {
      setError('Completa el nombre y el correo.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña temporal debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await userApi.createOperator({ fullName, email, password });
      onCreated();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      icon={
        <span className="modal-icon">
          <Icon name="person_add" />
        </span>
      }
      title="Nuevo Usuario"
      subtitle="Registrar una nueva cuenta autorizada en la plataforma"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-navy" onClick={() => void save()} disabled={saving}>
            <Icon name="check" />
            {saving ? 'Guardando…' : 'Guardar usuario'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label modal-label">
          Nombre completo <span className="required">*</span>
        </span>
        <input className="input" placeholder="ej. Ing. Pedro Ramírez Gálvez" maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} autoFocus />
        <span className="hint">Incluir prefijo institucional y apellidos completos</span>
      </label>
      <label className="field">
        <span className="field-label modal-label">
          Correo institucional <span className="required">*</span>
        </span>
        <span className="input-icon">
          <Icon name="mail" />
          <input className="input" type="email" placeholder="pramirez@munlima.gob.pe" value={email} onChange={(event) => setEmail(event.target.value)} />
        </span>
      </label>
      <div className="users-two">
        <label className="field">
          <span className="field-label modal-label">
            Rol asignado <span className="required">*</span>
          </span>
          <select className="select" disabled>
            <option>Operador municipal</option>
          </select>
          <span className="hint">Los ciudadanos se registran desde la app</span>
        </label>
        <label className="field">
          <span className="field-label modal-label">
            Contraseña temporal <span className="required">*</span>
          </span>
          <input className="input" type="text" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} />
          <span className="hint">Compártela con la persona por un canal seguro</span>
        </label>
      </div>
      <div className="notice">
        <Icon name="verified_user" />
        <span>La cuenta quedará activa de inmediato. El nuevo operador puede cambiar su contraseña desde Configuración › Seguridad.</span>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </Modal>
  );
}
