import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  // @ts-expect-error vitest extends the vite config but the type isn't merged here
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external access
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ghzm.us',
      'www.ghzm.us',
      '.nicola.id', // Allow all nicola.id subdomains
    ],
    // Proxy untuk handle CORS
    proxy: {
      '/api/proxy': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Don't expose source code in production
    rollupOptions: {
      output: {
        // Split heavy vendor libs into their own chunks so the initial
        // bundle stays lean. react-player drags in dozens of provider
        // shims; lucide-react ships a lot of icons. Both are heavy enough
        // to warrant isolation from the React runtime.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'react-query': ['@tanstack/react-query'],
          'player': ['react-player'],
          'icons': ['lucide-react'],
          'http': ['axios'],
        },
      },
    },
  },
})
