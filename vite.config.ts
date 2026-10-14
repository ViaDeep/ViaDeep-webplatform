/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

import pkg from './package.json' with { type: 'json' };

// En desarrollo Vite reenvía cada ruta a su microservicio, así el navegador ve un solo origen (sin CORS),
// igual que en producción con el API Gateway.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.BACKEND_HOST || 'localhost';
  return {
    plugins: [react()],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy: {
        '/auth': `http://${host}:8081`,
        '/incidents': `http://${host}:8082`,
        '/evidences': `http://${host}:8083`,
        '/notifications': `http://${host}:8084`,
      },
    },
    test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
  };
});
