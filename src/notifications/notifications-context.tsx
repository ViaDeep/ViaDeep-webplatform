import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { incidentApi } from '@/api/incident-api';
import { useSession } from '@/session/session';

import { buildNotifications, initialReadState, isUnread, type OperatorNotification, type ReadState } from './notifications';

const REFRESH_MS = 60_000;

type Preferences = { onScreen: boolean };

type NotificationsValue = {
  notifications: OperatorNotification[];
  unread: number;
  loading: boolean;
  isUnread: (notification: OperatorNotification) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: el estado de lectura dura lo que la pestaña.
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const readKey = `viadeep.notifications.read.${user?.id ?? 'anon'}`;
  const prefsKey = `viadeep.notifications.prefs.${user?.id ?? 'anon'}`;
  const [notifications, setNotifications] = useState<OperatorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readState, setReadState] = useState<ReadState>(() => load(readKey, initialReadState()));
  const [preferences, setPreferencesState] = useState<Preferences>(() => load(prefsKey, { onScreen: true }));

  const refresh = useCallback(async () => {
    try {
      const page = await incidentApi.search({ sort: 'updatedAt', size: 50 });
      setNotifications(buildNotifications(page.items));
    } catch {
      // Se reintenta en el siguiente ciclo; la barra superior ya muestra si no hay conexión.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    incidentApi
      .search({ sort: 'updatedAt', size: 50 })
      .then((page) => setNotifications(buildNotifications(page.items)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const updateRead = useCallback(
    (next: ReadState) => {
      setReadState(next);
      save(readKey, next);
    },
    [readKey],
  );

  const value = useMemo<NotificationsValue>(() => {
    const unreadCheck = (notification: OperatorNotification) => isUnread(notification, readState);
    return {
      notifications,
      loading,
      unread: preferences.onScreen ? notifications.filter(unreadCheck).length : 0,
      isUnread: unreadCheck,
      markRead: (id) => updateRead({ ...readState, readIds: [...readState.readIds.slice(-200), id] }),
      markAllRead: () => updateRead({ readAllAt: new Date().toISOString(), readIds: [] }),
      refresh,
      preferences,
      setPreferences: (next) => {
        setPreferencesState(next);
        save(prefsKey, next);
      },
    };
  }, [notifications, loading, readState, preferences, refresh, updateRead, prefsKey]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- el hook vive junto a su proveedor
export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return value;
}
