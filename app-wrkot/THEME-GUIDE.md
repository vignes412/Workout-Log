# Black and White Theme Implementation Guide

## Overview

This document provides a guide to the new black and white theme with dark/light mode toggle functionality implemented in the workout tracking application.

## Theme Philosophy

The new theme follows a monochromatic design aesthetic with:
- Grayscale color palette as the primary visual language
- Minimal use of accent colors for essential indicators only
- High contrast for readability and accessibility
- Support for both light and dark modes

## Theme Structure

### 1. Color Variables

The theme is defined in two main files:
- `src/styles/theme.ts` - Contains the TypeScript definitions for both light and dark themes
- `src/styles/theme.css` - Contains the CSS variables that apply the theme to the application

### 2. Theme Context

The theme context (`src/contexts/ThemeContext.tsx`) provides:
- Current theme state (light or dark)
- Toggle function to switch between themes
- Persistence of user theme preference in localStorage
- Detection of system theme preferences

### 3. Theme Toggle Component

The toggle button (`src/components/ThemeToggle.tsx`) offers:
- Visual indication of current theme mode
- Accessible toggle mechanism with keyboard support
- Smooth transitions between theme states

## Using the Theme

### Accent Colors

Accent colors are intended for minimal use as indicators only:

```css
/* Use accent colors only for indicators */
<span className="indicator-success">Success message</span>
<span className="indicator-error">Error message</span>
<span className="indicator-warning">Warning message</span>
<span className="indicator-info">Info message</span>
```

### Theme Toggle

Add the theme toggle to any component:

```tsx
import { ThemeToggle } from '../components/ThemeToggle';

// In your component JSX
<ThemeToggle />
```

### Accessing Theme State

Access the current theme state in any component:

```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { themeMode, toggleTheme } = useTheme();
  
  return (
    <div>
      Current theme: {themeMode}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

## Best Practices

1. Use the CSS variables for all styling to ensure theme consistency
2. Only use accent colors for critical indicators, not for decorative purposes
3. Test all UI components in both light and dark modes
4. Ensure adequate contrast between text and backgrounds
5. Use the transition variables for smooth theme switching
