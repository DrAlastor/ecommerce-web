import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        target: 'https://fashionstorestorage.blob.core.windows.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-storage/, ''),
      },
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
