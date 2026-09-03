import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      /* New builds take over on the next load. No update UI, no behaviour change. */
      registerType: 'autoUpdate',
      /* A separate file rather than an inline script, so a strict CSP still applies. */
      injectRegister: 'script-defer',

      manifest: {
        id: '/',
        name: 'FRISA - Fridge’s Smart Assistant',
        short_name: 'FRISA',
        description:
          'An AIoT food intelligence assistant that helps households know what they have, use it at the right time, and waste less.',
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#25B877',
        background_color: '#F7F9F8',
        categories: ['food', 'lifestyle', 'productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Scan food',
            short_name: 'Scan',
            description: 'Add an item through the FRISA hub camera',
            url: '/scan',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Smart inventory',
            short_name: 'Inventory',
            description: 'See everything in your fridge',
            url: '/inventory',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Smart recipes',
            short_name: 'Recipes',
            description: 'Cook with what you already have',
            url: '/recipes',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
      },

      workbox: {
        /* Everything the app shell needs, so it opens offline after the first visit. */
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        /* Unused leftovers from the starter template - kept on disk, not shipped offline. */
        globIgnores: ['vite.svg', 'Images/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        /* The app is a single page router: unknown paths resolve to the shell. */
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'frisa-google-fonts-stylesheets',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'frisa-google-fonts-files',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      /* The dev server stays exactly as it was; test installability with
         `npm run build && npm run preview`, or on the deployed site. */
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
