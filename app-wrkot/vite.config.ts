import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import deadFile from 'vite-plugin-deadfile';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite'

// Get repository name from GitHub Pages URL
const getRepoName = () => {
  // For GitHub Pages: https://username.github.io/repo-name/
  // Extract repo-name from package.json or env var if available
  return './'; // Replace this with your actual repo name if different
}

export default defineConfig({
  base:  './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'icons/*.png', 
        'icons/*.svg', 
        'offline.html',
        'robots.txt'
      ],
      strategies: 'generateSW',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'classic', // Using classic mode for better compatibility
        navigateFallback: 'index.html',
      },
      manifest: false, // Using our custom manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpeg,jpg,json,woff,woff2,ttf,eot}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__\//, /^\/api\//],
        skipWaiting: true,
        clientsClaim: true,
        offlineGoogleAnalytics: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sheets-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              backgroundSync: {
                name: 'sheets-queue',
                options: {
                  maxRetentionTime: 24 * 60 // 1 day in minutes
                }
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/auth\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 12 * 60 * 60 // 12 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:css|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }    }),
    visualizer(),
    deadFile({
      root: 'src', // Scan files in src directory
      exclude: ['src/vite-env.d.ts'], // Exclude specific files
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 3000,
    // Ensure error overlay is enabled (default is true)
    hmr: {
      overlay: true
    }
  },
  // Optimize build for PWA
  build: {
    sourcemap: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pwa-components': ['./src/components/PWAHandler.tsx', './src/components/OfflineIndicator.tsx'],
          'db-utils': ['./src/lib/db.ts', './src/lib/pwa-utils.ts']
        }
      }
    }
  }
})
