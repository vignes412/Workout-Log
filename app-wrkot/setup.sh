#!/bin/bash

# Script to set up a React TypeScript dashboard SPA with Vite, esbuild, PWA, Google Authentication, and CSS maintenance
# Run this in the Vite project directory (dashboard-app) after Step 2: bash setup-dashboard-app.sh
# Excludes testing dependencies/configurations as per user request

# Exit on error
set -e

# Variables
PROJECT_NAME="app-wrkot"
VITE_PORT="3000"

# Step 1: Verify current directory is a Vite project
echo "Verifying Vite project..."
if [ ! -f "package.json" ] || ! grep -q "vite" package.json; then
    echo "Error: This is not a Vite project directory. Please run in the Vite project root (app-wrkot)."
    exit 1
fi
if [ ! -f "vite.config.ts" ] || ! grep -q "@vitejs/plugin-react" vite.config.ts; then
    echo "Error: Vite project must use @vitejs/plugin-react (esbuild). Ensure TypeScript template was used."
    exit 1
fi
echo "Vite project verified."

# Step 2: Install core dependencies
echo "Installing core dependencies..."
npm install react-router-dom@6 zustand react-hook-form @hookform/resolvers zod framer-motion axios socket.io-client @sentry/react posthog-js idb --save
npm install vite-plugin-pwa rollup-plugin-visualizer --save-dev
# Dependencies for Google Authentication
npm install @react-oauth/google@latest jwt-decode --save
# Dependencies for CSS maintenance
npm install typescript-plugin-css-modules eslint-plugin-tailwindcss prettier-plugin-tailwindcss --save-dev

# Step 3: Initialize Shadcn UI
echo "Initializing Shadcn UI with Tailwind CSS..."
npx shadcn-ui@latest init -y
# Add common Shadcn UI components for dashboard
npx shadcn-ui@latest add button card datatable dialog dropdown-menu --yes



# Step 5: Configure project structure
echo "Setting up project structure..."
mkdir -p src/{components,pages,hooks,stores,services,types,utils,assets,styles,context}
mkdir -p public/icons
touch src/App.tsx
touch src/main.tsx
touch src/components/{NavBar.tsx,Sidebar.tsx,GoogleAuthButton.tsx,GoogleAuthButton.module.css}
touch src/pages/{Dashboard.tsx,Analytics.tsx,Settings.tsx}
touch src/hooks/{useDashboardData.ts,useGoogleAuth.ts}
touch src/stores/{dashboardStore.ts}
touch src/services/{sheetsService.ts,socketService.ts}
touch src/types/{index.ts,metric.ts,auth.ts}
touch src/utils/{format.ts}
touch src/styles/{global.css}
touch src/context/{DashboardContext.ts}
touch .env
touch .eslintrc
touch .prettierrc

# Step 6: Configure TypeScript
echo "Configuring TypeScript with CSS Modules support..."
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "plugins": [{ "name": "typescript-plugin-css-modules" }]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOL

# Step 7: Configure Vite with PWA
echo "Configuring Vite with PWA plugin..."
cat > vite.config.ts << EOL
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dashboard App',
        short_name: 'Dashboard',
        description: 'A fast, robust dashboard PWA with Google Authentication',
        theme_color: '#1e40af',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60
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
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|css|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      }
    }),
    visualizer()
  ]
})
EOL

# Step 8: Configure Tailwind CSS
echo "Configuring Tailwind CSS..."
cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        secondary: '#4b5563'
      }
    }
  },
  plugins: [],
  darkMode: 'class'
}
EOL

cat > src/styles/global.css << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# Step 9: Configure ESLint for Tailwind
echo "Configuring ESLint for Tailwind CSS..."
cat > .eslintrc << EOL
{
  "env": { "browser": true, "es2021": true },
  "extends": ["plugin:react/recommended", "plugin:tailwindcss/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react", "@typescript-eslint", "tailwindcss"],
  "rules": { "tailwindcss/classnames-order": "warn" }
}
EOL

# Step 10: Configure Prettier for Tailwind
echo "Configuring Prettier for Tailwind CSS..."
cat > .prettierrc << EOL
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOL

# Step 11: Update package.json scripts
echo "Updating package.json scripts..."
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.storybook="storybook dev -p 6006"
npm pkg set scripts.build-storybook="storybook build"

# Step 12: Create placeholder files with comments
echo "Creating placeholder files..."
cat > src/App.tsx << EOL
// Main App component with React Router setup
// Define routes for Dashboard, Analytics, Settings
// Use React.lazy and Suspense for lazy loading
// Integrate Google Authentication status
EOL

cat > src/main.tsx << EOL
// Entry point for React app
// Initialize Sentry and PostHog for monitoring
// Render App with BrowserRouter and GoogleOAuthProvider
EOL

cat > src/components/GoogleAuthButton.tsx << EOL
// Component for Google Authentication button
// Use @react-oauth/google for login/logout
// Apply Tailwind classes and GoogleAuthButton.module.css for styling
// Display user info or login button based on auth status
EOL

cat > src/components/GoogleAuthButton.module.css << EOL
/* Scoped CSS for Google Authentication button */
/* Example: Custom hover effects, pseudo-elements, or Google branding styles */
/* Use for styles not achievable with Tailwind */
EOL

cat > src/stores/dashboardStore.ts << EOL
// Zustand store for dashboard state
// Define state and actions for metrics, filters, user preferences
// Include Google auth token and user info
// Use TypeScript interfaces from src/types
EOL

cat > src/services/sheetsService.ts << EOL
// Service for Google Sheets API integration
// Use Axios with Google auth token to read/write data
// Cache responses in IndexedDB (via idb) for offline support
EOL

cat > src/services/socketService.ts << EOL
// Service for Socket.io real-time updates
// Connect to Socket.io server and handle events
EOL

cat > src/types/metric.ts << EOL
// TypeScript interfaces for dashboard data
// Example: interface Metric { id: string; name: string; value: number; }
EOL

cat > src/types/auth.ts << EOL
// TypeScript interfaces for Google Authentication
// Example: interface GoogleUser { id: string; email: string; name: string; }
EOL

cat > src/pages/Dashboard.tsx << EOL
// Dashboard page component
// Display metrics using Shadcn UI DataTable
// Use Tailwind for styling, CSS Modules for complex styles
// Use Zustand store and Google Sheets data
// Show Google auth status
EOL

cat > src/hooks/useGoogleAuth.ts << EOL
// Custom hook for Google Authentication
// Handle login, logout, and token management
// Integrate with dashboardStore
EOL

cat > src/context/DashboardContext.ts << EOL
// React Context for local dashboard state
// Example: Manage chart filters or view settings
EOL

# Step 13: Initialize Git
echo "Initializing Git repository..."
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
git add .
git commit -m "Setup React TypeScript dashboard with Google Authentication and CSS maintenance"

# Step 14: Instructions for next steps
echo "Setup complete! Next steps:"
echo "1. Create PWA icons (192x192, 512x512) and place in public/icons/"
echo "2. Set up Google Authentication and Sheets API: Follow instructions below."
echo "3. Set up Socket.io backend: Follow instructions below."
echo "4. Run 'npm run dev' to start the development server."
echo "5. Implement components, routes, services, and Google auth manually."
echo "6. Use Tailwind CSS for most styling and CSS Modules for edge cases (e.g., GoogleAuthButton)."
echo "7. Deploy to Vercel: Follow instructions below."