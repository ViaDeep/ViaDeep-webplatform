import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi, type User } from '@/api/auth-api';
import { configureSession } from '@/api/http';

const TOKEN_KEY = 'viadeep.operatorToken';

type Session = {
  loading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin almacenamiento (modo privado): la sesión dura lo que la pestaña.
  }
}

let currentToken: string | null = readToken();

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(currentToken !== null);

  const signOut = useCallback(() => {
    currentToken = null;
    writeToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    configureSession({ getToken: () => currentToken, onUnauthorized: signOut });
    if (!currentToken) return;
    authApi
      .me()
      .then((me) => (me.role === 'OPERATOR' ? setUser(me) : signOut()))
      .catch(signOut)
      .finally(() => setLoading(false));
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await authApi.login(email.trim(), password);
    const me = await authApi.me(token);
    if (me.role !== 'OPERATOR') {
      throw new Error('Esta plataforma es para operadores municipales. Los ciudadanos usan la app móvil.');
    }
    currentToken = token;
    writeToken(token);
    setUser(me);
  }, []);

  const value = useMemo(() => ({ loading, user, signIn, signOut }), [loading, user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider');
  return value;
}
