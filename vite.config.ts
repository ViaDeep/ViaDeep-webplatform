/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

// En desarrollo Vite reenvía cada ruta a su microservicio, así el navegador ve un solo origen (sin CORS),
// igual que en producción con el API Gateway.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.BACKEND_HOST || 'localhost';
  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy: {
        '/auth': `http://${host}:8081`,
        '/incidents': `http://${host}:8082`,
        '/evidences': `http://${host}:8083`,
      },
    },
    test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
  };
});
