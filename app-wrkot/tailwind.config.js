/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {    extend: {      
      // Font family - Updated to Inter
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'roboto': ['Roboto', 'system-ui', 'sans-serif'],
      },
      
      // Font sizes based on modern design system
      fontSize: {
        'h1': '2.25rem',     // 36px - Page titles
        'h2': '1.75rem',     // 28px - Section headers
        'h3': '1.5rem',      // 24px - Subsection headers
        'h4': '1.25rem',     // 20px - Card titles
        'h5': '1.125rem',    // 18px - Smaller headings
        'body': '1rem',      // 16px - Body text
        'small': '0.875rem', // 14px - Small text
        'xs': '0.75rem',     // 12px - Extra small text
      },      // Custom container width values moved to Layout dimensions section
      
      // Custom spacing values
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32px
        '2xl': '2.5rem',   // 40px
        '3xl': '3rem',     // 48px
        '4xl': '4rem',     // 64px
      },
      
      // Breakpoints for responsive design
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Modern color system
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          light: "hsl(var(--accent-light))",
          foreground: "hsl(var(--accent-foreground, 0 0% 98%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      
      // Typography system
      fontWeight: {
        light: 'var(--font-weight-light, 300)',
        regular: 'var(--font-weight-regular, 400)',
        medium: 'var(--font-weight-medium, 500)',
        semibold: 'var(--font-weight-semibold, 600)',
        bold: 'var(--font-weight-bold, 700)',
      },
      lineHeight: {
        tight: 'var(--line-height-header, 1.2)',
        base: 'var(--line-height-body, 1.6)',
        relaxed: 'var(--line-height-button, 1.5)',
      },
      
      // Border radius
      borderRadius: {
        'xs': 'var(--border-radius-xs)',
        'sm': 'var(--border-radius-sm)',
        'md': 'var(--border-radius-md)',
        'lg': 'var(--border-radius-lg)',
        'xl': 'var(--border-radius-xl)',
        'full': 'var(--border-radius-full)',
      },
      
      // Shadows
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glass': 'var(--glass-shadow)',
        'card': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'button': '0 2px 5px 0 rgba(0, 0, 0, 0.08)',
        'button-hover': '0 4px 15px 0 rgba(0, 0, 0, 0.1)',
      },
      
      // Transitions
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'width': 'width',
        'bg': 'background-color, background-image',
        'button': 'background-color, border-color, color, transform, box-shadow',
      },
      
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
      },
      
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': 'var(--glass-blur)',
        'lg': '16px',
        'xl': '24px',
      },
      
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5%)' },
        },
      },
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
  }