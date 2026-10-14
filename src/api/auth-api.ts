import { isAxiosError } from 'axios';

import { http } from './http';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'OPERATOR';
  phone: string | null;
  documentNumber: string | null;
};

export const authApi = {
  async login(email: string, password: string): Promise<string> {
    try {
      const { data } = await http.post<{ accessToken: string }>('/auth/login', { email, password });
      return data.accessToken;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) throw new Error('Correo o contraseña incorrectos.');
      throw error;
    }
  },

  async me(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const { data } = await http.get<User>('/auth/me', { headers });
    return data;
  },
};
