import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { notificationApi } from '@/api/notification-api';
import { useSession } from '@/session/session';

import { toOperatorNotification, type OperatorNotification } from './notifications';

const REFRESH_MS = 60_000;
/** Avisos que se cargan para la pantalla de notificaciones (máximo de una página del servicio). */
const LOADED = 100;

type Preferences = { onScreen: boolean };

type NotificationsValue = {
  notifications: OperatorNotification[];
  /** Avisos no leídos según el servicio (todos, no solo los cargados). */
  unread: number;
  total: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

function loadPreferences(key: string): Preferences {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Preferences) : { onScreen: true };
  } catch {
    return { onScreen: true };
  }
}

type Snapshot = { notifications: OperatorNotification[]; unread: number; total: number };

async function fetchSnapshot(): Promise<Snapshot> {
  const [page, unread] = await Promise.all([notificationApi.list({ size: LOADED }), notificationApi.unreadCount()]);
  return { notifications: page.items.map(toOperatorNotification), unread, total: page.totalItems };
}

/** Avisos del operador desde el servicio de notificaciones; la lectura se guarda en el backend por usuario. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const prefsKey = `viadeep.notifications.prefs.${user?.id ?? 'anon'}`;
  const [snapshot, setSnapshot] = useState<Snapshot>({ notifications: [], unread: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferencesState] = useState<Preferences>(() => loadPreferences(prefsKey));

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchSnapshot());
    } catch {
      // Se reintenta en el siguiente ciclo; la barra superior ya muestra si no hay conexión.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot()
      .then(setSnapshot)
      .catch(() => undefined)
      .finally(() => setLoading(false));
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo<NotificationsValue>(
    () => ({
      ...snapshot,
      loading,
      unread: preferences.onScreen ? snapshot.unread : 0,
      markRead: (id) => {
        const target = snapshot.notifications.find((notification) => notification.id === id);
        if (!target || target.read) return;
        setSnapshot((current) => ({
          ...current,
          unread: Math.max(current.unread - 1, 0),
          notifications: current.notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
        }));
        notificationApi.markRead(id).catch(() => void refresh());
      },
      markAllRead: () => {
        setSnapshot((current) => ({ ...current, unread: 0, notifications: current.notifications.map((notification) => ({ ...notification, read: true })) }));
        notificationApi.markAllRead().catch(() => void refresh());
      },
      refresh,
      preferences,
      setPreferences: (next) => {
        setPreferencesState(next);
        try {
          localStorage.setItem(prefsKey, JSON.stringify(next));
        } catch {
          // Sin almacenamiento: la preferencia dura lo que la pestaña.
        }
      },
    }),
    [snapshot, loading, preferences, refresh, prefsKey],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- el hook vive junto a su proveedor
export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return value;
}
