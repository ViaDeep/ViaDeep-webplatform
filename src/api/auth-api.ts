import { isAxiosError } from 'axios';

import type { Page } from '@/domain/incident';

import { http } from './http';

export type Role = 'CITIZEN' | 'OPERATOR';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone: string | null;
  documentNumber: string | null;
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  /** true mientras el operador tenga la contraseña temporal con la que lo dieron de alta. */
  passwordChangeRequired: boolean;
  /** El encargado que designa la municipalidad: el único que crea, activa y desactiva cuentas. */
  administrator: boolean;
};

export type UserFilters = { role?: Role; enabled?: boolean; q?: string; page?: number; size?: number };

/** Operador activo que puede ser responsable de una incidencia. */
export type OperatorSummary = { id: string; fullName: string; email: string };

export type NewOperator = { fullName: string; email: string; documentNumber: string; password: string };

export const authApi = {
  async login(email: string, password: string): Promise<string> {
    try {
      const { data } = await http.post<{ accessToken: string }>('/auth/login', { email, password });
      return data.accessToken;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) throw new Error('Correo o contraseña incorrectos.');
      if (isAxiosError(error) && error.response?.status === 403) {
        const detail = (error.response.data as { detail?: string } | undefined)?.detail;
        throw new Error(detail ?? 'Tu cuenta está desactivada.');
      }
      throw error;
    }
  },

  async me(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const { data } = await http.get<User>('/auth/me', { headers });
    return data;
  },

  async updateProfile(changes: { fullName: string; phone: string; documentNumber: string }): Promise<User> {
    const { data } = await http.put<User>('/auth/me', {
      fullName: changes.fullName.trim(),
      phone: changes.phone.trim() || null,
      documentNumber: changes.documentNumber.trim() || null,
    });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await http.put('/auth/me/password', { currentPassword, newPassword });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) throw new Error('La contraseña actual no es correcta.');
      throw error;
    }
  },
};

export const userApi = {
  async search(filters: UserFilters): Promise<Page<User>> {
    const { data } = await http.get<Page<User>>('/auth/users', { params: { ...filters, q: filters.q?.trim() || undefined } });
    return data;
  },

  async get(id: string): Promise<User> {
    const { data } = await http.get<User>(`/auth/users/${id}`);
    return data;
  },

  /** El administrador corrige el nombre y el celular de una cuenta; el correo y el DNI no cambian. */
  async update(id: string, changes: { fullName: string; phone: string }): Promise<User> {
    const { data } = await http.put<User>(`/auth/users/${id}`, { fullName: changes.fullName.trim(), phone: changes.phone.trim() || null });
    return data;
  },

  /** Operadores activos, para elegir al responsable de una incidencia (lo puede pedir cualquier operador). */
  async operators(): Promise<OperatorSummary[]> {
    const { data } = await http.get<OperatorSummary[]>('/auth/operators');
    return data;
  },

  async setEnabled(id: string, enabled: boolean): Promise<User> {
    const { data } = await http.patch<User>(`/auth/users/${id}/status`, { enabled });
    return data;
  },

  async setAdministrator(id: string, administrator: boolean): Promise<User> {
    const { data } = await http.patch<User>(`/auth/users/${id}/administrator`, { administrator });
    return data;
  },

  async createOperator(operator: NewOperator): Promise<void> {
    await http.post('/auth/operators', {
      fullName: operator.fullName.trim(),
      email: operator.email.trim(),
      documentNumber: operator.documentNumber.trim(),
      password: operator.password,
    });
  },
};
