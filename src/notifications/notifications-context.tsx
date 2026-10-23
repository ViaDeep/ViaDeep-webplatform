import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { notificationApi } from '@/api/notification-api';
import { announceDataChanged } from '@/live/data-changed';
import { useSession } from '@/session/session';

import { toOperatorNotification, type OperatorNotification } from './notifications';

/** Cada cuánto se consultan avisos nuevos: un reporte enviado desde la app aparece en segundos. */
const REFRESH_MS = 5_000;
/** Cuánto queda en pantalla la alerta de un reporte nuevo. */
const ALERT_MS = 8_000;
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
  /** Reportes que llegaron mientras la plataforma estaba abierta, para la alerta emergente. */
  alerts: OperatorNotification[];
  dismissAlert: (id: string) => void;
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
  const [alerts, setAlerts] = useState<OperatorNotification[]>([]);
  const known = useRef<Set<string> | null>(null);

  const dismissAlert = useCallback((id: string) => setAlerts((current) => current.filter((alert) => alert.id !== id)), []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSnapshot();
      const seen = known.current;
      known.current = new Set(next.notifications.map((notification) => notification.id));
      setSnapshot(next);
      // La primera carga solo registra lo que ya había; desde ahí, cada aviso nuevo dispara la alerta.
      const fresh = seen ? next.notifications.filter((notification) => !seen.has(notification.id) && !notification.read) : [];
      if (fresh.length > 0) {
        announceDataChanged();
        setAlerts((current) => [...fresh, ...current].slice(0, 3));
        fresh.forEach((notification) => window.setTimeout(() => dismissAlert(notification.id), ALERT_MS));
      }
    } catch {
      // Se reintenta en el siguiente ciclo; la plataforma ya avisa si no hay conexión.
    } finally {
      setLoading(false);
    }
  }, [dismissAlert]);

  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
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
      alerts: preferences.onScreen ? alerts : [],
      dismissAlert,
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
    [snapshot, loading, preferences, refresh, prefsKey, alerts, dismissAlert],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- el hook vive junto a su proveedor
export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return value;
}
