/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Color system - black and white theme
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // Typography system from style guidelines
      fontFamily: {
        sans: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'page-title': 'var(--font-size-page-title, 34px)',
        'section-header': 'var(--font-size-section-header, 24px)',
        'body': 'var(--font-size-body, 16px)',
        'button': 'var(--font-size-button, 15px)',
        'caption': 'var(--font-size-caption, 14px)',
      },
      fontWeight: {
        regular: 'var(--font-weight-regular, 400)',
        emphasis: 'var(--font-weight-emphasis, 500)',
        header: 'var(--font-weight-header, 600)',
      },
      lineHeight: {
        header: 'var(--line-height-header, 1.2)',
        body: 'var(--line-height-body, 1.5)',
        button: 'var(--line-height-button, 1.75)',
      },
      
      // Spacing system
      spacing: {
        'xs': 'var(--spacing-xs, 4px)',
        'sm': 'var(--spacing-sm, 8px)',
        'md': 'var(--spacing-md, 16px)',
        'lg': 'var(--spacing-lg, 24px)',
        'xl': 'var(--spacing-xl, 32px)',
        'xxl': 'var(--spacing-xxl, 48px)',
      },
      
      // Border radius system
      borderRadius: {
        'card': 'var(--border-radius-card, 12px)',
        'button': 'var(--border-radius-button, 4px)',
        'input': 'var(--border-radius-input, 4px)',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Shadow system
      boxShadow: {
        'card': 'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.05))',
      },
      
      // Layout dimensions
      maxWidth: {
        'container': 'var(--container-max-width, 1200px)',
        'card': 'var(--card-max-width, 400px)',
      },
      minWidth: {
        'card': 'var(--card-min-width, 280px)',
      },
      height: {
        'button': 'var(--height-button, 36px)',
        'input': 'var(--height-input, 56px)',
        'header': 'var(--header-height, 64px)',
        'exercise-row': 'var(--exercise-row-height, 72px)',
        'set-counter': 'var(--set-counter-height, 48px)',
        'progress-linear': 'var(--height-progress-linear, 4px)',
      },
      width: {
        'sidebar': 'var(--sidebar-width, 240px)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width, 64px)',
        'progress-circular': 'var(--size-progress-circular, 40px)',
      },
      
      // Grid system
      gridTemplateColumns: {
        'mobile': 'repeat(1, minmax(0, 1fr))',
        'tablet': 'repeat(2, minmax(0, 1fr))',
        'desktop': 'repeat(4, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
      gap: {
        'grid': 'var(--spacing-md, 16px)',
      },
    }
  },
  plugins: [],
  darkMode: 'class',
  
  // Custom media queries based on breakpoints
  screens: {
    'mobile': {'max': '600px'},
    'tablet': {'min': '601px', 'max': '960px'},
    'desktop': {'min': '961px'},
  },
}
