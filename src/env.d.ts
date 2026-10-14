/** Versión de package.json, inyectada por Vite (se muestra en Configuración). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** URL base de la API en producción (por defecto, el mismo origen). */
  readonly VITE_API_URL?: string;
  /** Clave de CARTO para el mapa de calles; sin ella se usa OpenStreetMap. */
  readonly VITE_CARTO_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
