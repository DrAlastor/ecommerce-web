import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { offlinePwa } from './offline-pwa.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react(), offlinePwa()],
  server: {
    watch: {
      ignored: [
        '**/public/**',
        '**/*.glb',
        '**/*.gltf',
        '**/*.bin',
        '**/*.rar',
        '**/*.zip',
        '**/*.7z',
      ],
    },
    proxy: {
      '/azure-storage': {
        target: 'https://fashionstorestorages.blob.core.windows.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-storage/, ''),
      },
      '/api': {
        target: process.env.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
};
})
