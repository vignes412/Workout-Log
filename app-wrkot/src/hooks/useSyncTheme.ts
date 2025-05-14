// This utility acts as a bridge between different theme state management approaches
import { useTheme } from '@/contexts/ThemeProvider';
import { useAppStore } from '@/store/appStore';
import { useEffect } from 'react';

// This hook syncs the theme state from the new ThemeProvider with appStore
export function useSyncTheme() {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useAppStore();
  
  // Sync theme from ThemeProvider to appStore
  useEffect(() => {
    // Convert 'system' theme to actual 'light'/'dark' for appStore
    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(isSystemDark ? 'dark' : 'light');
    } else {
      setThemeMode(theme === 'dark' ? 'dark' : 'light');
    }
  }, [theme, setThemeMode]);

  return { theme, themeMode };
}
