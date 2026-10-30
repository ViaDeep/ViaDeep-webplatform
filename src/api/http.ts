import axios, { isAxiosError, type AxiosError } from 'axios';

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

/** La sesión registra cómo leer el token y qué hacer si el backend responde 401. */
export function configureSession(hooks: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = hooks.getToken;
  onUnauthorized = hooks.onUnauthorized;
}

/** Las rutas son relativas: en desarrollo las reenvía Vite y en producción el API Gateway. */
export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '', timeout: 15000 });

/** Estado de la conexión con el backend según la última respuesta (lo muestran la barra superior y el menú). */
export type Connection = { online: boolean; latencyMs: number | null };

let connection: Connection = { online: true, latencyMs: null };
const listeners = new Set<() => void>();

function report(next: Connection) {
  connection = next;
  listeners.forEach((listener) => listener());
}

export const connectionStore = {
  get: (): Connection => connection,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const startedAt = new WeakMap<object, number>();

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  startedAt.set(config, performance.now());
  return config;
});

http.interceptors.response.use(
  (response) => {
    const start = startedAt.get(response.config);
    report({ online: true, latencyMs: start === undefined ? connection.latencyMs : Math.round(performance.now() - start) });
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) report({ online: false, latencyMs: null });
    else report({ ...connection, online: true });
    if (error.response?.status === 401 && getToken()) onUnauthorized();
    return Promise.reject(error);
  },
);

const MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para esta acción.',
  404: 'No se encontró el registro.',
  503: 'El servicio no está disponible. Intenta de nuevo en unos minutos.',
};

/** Mensaje listo para mostrar a partir de un error de red o de un ProblemDetail del backend. */
export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor.';
    const detail = (error.response.data as { detail?: string } | undefined)?.detail;
    return MESSAGES[error.response.status] ?? detail ?? 'Ocurrió un error inesperado.';
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
