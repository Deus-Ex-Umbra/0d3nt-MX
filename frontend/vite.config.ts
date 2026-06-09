import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const esBuild = command === 'build';

  return {
    plugins: [react()],
    // En Electron usamos `loadFile(...)` (file://). Necesitamos rutas relativas en producción.
    base: esBuild ? './' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});