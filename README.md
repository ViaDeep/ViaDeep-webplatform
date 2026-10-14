# ViaDeep-webplatform

Plataforma web para los operadores municipales de ViaDeep: revisar, clasificar y dar seguimiento a las incidencias viales que reportan los ciudadanos desde la app móvil.

Hecha con React 19, TypeScript y Vite.

## Requisitos

- Node.js 22 LTS (o 20.19 o superior)
- El backend ([ViaDeep-backend](https://github.com/ViaDeep/ViaDeep-backend)) corriendo con los servicios de autenticación (8081), incidencias (8082) y evidencias (8083)
- Una cuenta de operador. El primer operador se crea al iniciar el servicio de autenticación con las variables `OPERATOR_EMAIL`, `OPERATOR_PASSWORD` y `OPERATOR_NAME`. Las cuentas de ciudadano no pueden entrar a esta plataforma.

## Levantar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` e inicia sesión con la cuenta de operador.

En desarrollo, Vite reenvía `/auth`, `/incidents` y `/evidences` a los servicios del backend, así que no hace falta configurar CORS. Si el backend corre en otra máquina, indica su dirección con `BACKEND_HOST`:

```bash
BACKEND_HOST=192.168.1.50 npm run dev
```

### Mapa SIG

El mapa de calles usa CARTO, que pide una clave gratuita desde septiembre de 2026. Pídela en https://carto.com/basemaps/apikey (uso no comercial, hasta 5 millones de teselas al mes) y guárdala en un archivo `.env.local` en la raíz del proyecto, que no se sube a GitHub:

```bash
VITE_CARTO_API_KEY=tu-clave
```

Reinicia `npm run dev` después de crearlo. Sin clave, el mapa usa el estilo estándar de OpenStreetMap.

Para un despliegue detrás del API Gateway, `VITE_API_URL` define la URL base de la API (por defecto, el mismo origen).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/` |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | Revisa el código con oxlint |
| `npm test` | Ejecuta las pruebas con Vitest |

## Estado

Ya funcionan el inicio de sesión de operadores, el dashboard, la tabla de incidencias con filtros y el detalle de una incidencia (cambio de estado y severidad). El diseño final de las 10 pantallas se aplicará a partir de los mockups de Figma; las secciones Mapa SIG, Asignaciones, Estadísticas, Usuarios, Notificaciones y Configuración están reservadas hasta entonces.
