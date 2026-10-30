import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi, type User } from '@/api/auth-api';
import { configureSession } from '@/api/http';

const TOKEN_KEY = 'viadeep.operatorToken';

type Session = {
  loading: boolean;
  user: User | null;
  /** Con `remember` el token queda en localStorage; si no, solo dura mientras la pestaña esté abierta. */
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
};

const SessionContext = createContext<Session | null>(null);

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null, remember = true) {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
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

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const token = await authApi.login(email.trim(), password);
    const me = await authApi.me(token);
    if (me.role !== 'OPERATOR') {
      throw new Error('Esta plataforma es para operadores municipales. Los ciudadanos usan la app móvil.');
    }
    currentToken = token;
    writeToken(token, remember);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ loading, user, signIn, signOut, updateUser: setUser }),
    [loading, user, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- el hook vive junto a su proveedor
export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider');
  return value;
}
