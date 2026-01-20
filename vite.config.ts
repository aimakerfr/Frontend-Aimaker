import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const portFromEnv = Number(env.VITE_PORT);
  const port = Number.isFinite(portFromEnv) && portFromEnv > 0 ? portFromEnv : 3001;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@core': path.resolve(__dirname, './core/src'),
        '@apps': path.resolve(__dirname, './apps'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
    publicDir: 'public',
    server: {
      port,
    },
  };
});