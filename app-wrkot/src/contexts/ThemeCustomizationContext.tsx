import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from './useTheme';

// Define theme elements that can be customized
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
  ring: string;
}

export interface ThemeOptions {
  fontFamily: string;
  borderRadius: string;
  shadow: string;
}

export interface ChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  options: ThemeOptions;
  chartColors: ChartColors;
}

export interface ThemeCustomizationContextType {
  currentTheme: ThemePreset;
  presets: ThemePreset[];
  addPreset: (preset: Omit<ThemePreset, 'id'>) => void;
  updatePreset: (id: string, updates: Partial<ThemePreset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;
  updateCurrentTheme: (updates: Partial<ThemePreset>) => void;
  resetToDefault: () => void;
}

// Default theme presets
export const defaultLightTheme: ThemePreset = {
  id: 'default-light',
  name: 'Default Light',
  description: 'Default black & white light theme',
  colors: {
    background: '0 0% 98%',
    foreground: '0 0% 12%',
    card: '0 0% 100%',
    cardForeground: '0 0% 12%',
    border: '0 0% 88%',
    input: '0 0% 96%',
    primary: '0 0% 12%',
    primaryForeground: '0 0% 98%',
    secondary: '0 0% 92%',
    secondaryForeground: '0 0% 12%',
    accent: '0 0% 92%',
    accentForeground: '0 0% 12%',
    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',
    success: '145 40% 42%',
    successForeground: '0 0% 98%',
    warning: '38 40% 50%',
    warningForeground: '0 0% 12%',
    error: '0 40% 50%',
    errorForeground: '0 0% 98%',
    info: '215 40% 50%',
    infoForeground: '0 0% 98%',
    ring: '0 0% 80%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  chartColors: {
    chart1: '0 0% 25%',
    chart2: '0 0% 45%',
    chart3: '0 0% 65%',
    chart4: '0 0% 35%',
    chart5: '0 0% 55%'
  }
};

export const defaultDarkTheme: ThemePreset = {
  id: 'default-dark',
  name: 'Default Dark',
  description: 'Default black & white dark theme',
  colors: {
    background: '0 0% 8%',
    foreground: '0 0% 92%',
    card: '0 0% 12%',
    cardForeground: '0 0% 92%',
    border: '0 0% 24%',
    input: '0 0% 16%',
    primary: '0 0% 92%',
    primaryForeground: '0 0% 12%',
    secondary: '0 0% 20%',
    secondaryForeground: '0 0% 92%',
    accent: '0 0% 22%',
    accentForeground: '0 0% 92%',
    muted: '0 0% 16%',
    mutedForeground: '0 0% 70%',
    success: '145 30% 38%',
    successForeground: '0 0% 92%',
    warning: '38 30% 45%',
    warningForeground: '0 0% 12%',
    error: '0 30% 45%',
    errorForeground: '0 0% 92%',
    info: '215 30% 45%',
    infoForeground: '0 0% 92%',
    ring: '0 0% 30%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
  },
  chartColors: {
    chart1: '0 0% 75%',
    chart2: '0 0% 55%',
    chart3: '0 0% 35%',
    chart4: '0 0% 65%',
    chart5: '0 0% 45%'
  }
};

// Blue theme preset
export const blueTheme: ThemePreset = {
  id: 'blue-theme',
  name: 'Blue Elegance',
  description: 'A calming blue color theme with subtle accents',
  colors: {
    background: '210 50% 98%',
    foreground: '220 40% 12%',
    card: '0 0% 100%',
    cardForeground: '220 40% 12%',
    border: '215 20% 85%',
    input: '214 32% 94%',
    primary: '215 90% 50%',
    primaryForeground: '210 40% 98%',
    secondary: '214 32% 94%',
    secondaryForeground: '215 50% 30%',
    accent: '215 90% 95%',
    accentForeground: '215 90% 40%',
    muted: '210 40% 95%',
    mutedForeground: '215 25% 45%',
    success: '145 65% 42%',
    successForeground: '0 0% 98%',
    warning: '38 95% 50%',
    warningForeground: '0 0% 12%',
    error: '0 90% 60%',
    errorForeground: '0 0% 98%',
    info: '215 90% 50%',
    infoForeground: '0 0% 98%',
    ring: '215 90% 65%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 10px rgba(0, 107, 230, 0.08)'
  },
  chartColors: {
    chart1: '215 90% 50%',
    chart2: '230 80% 60%',
    chart3: '245 70% 70%',
    chart4: '200 85% 55%',
    chart5: '195 95% 45%'
  }
};

// Green theme preset
export const greenTheme: ThemePreset = {
  id: 'green-theme',
  name: 'Forest Vibes',
  description: 'A refreshing green theme inspired by nature',
  colors: {
    background: '120 40% 98%',
    foreground: '120 30% 10%',
    card: '0 0% 100%',
    cardForeground: '120 30% 12%',
    border: '120 20% 86%',
    input: '120 16% 93%',
    primary: '142 70% 45%',
    primaryForeground: '120 60% 98%',
    secondary: '120 16% 93%',
    secondaryForeground: '142 50% 25%',
    accent: '142 60% 95%',
    accentForeground: '142 70% 35%',
    muted: '120 30% 95%',
    mutedForeground: '120 15% 45%',
    success: '142 70% 45%',
    successForeground: '0 0% 98%',
    warning: '38 95% 50%',
    warningForeground: '0 0% 12%',
    error: '0 90% 60%',
    errorForeground: '0 0% 98%',
    info: '200 85% 50%',
    infoForeground: '0 0% 98%',
    ring: '142 70% 60%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 10px rgba(16, 185, 129, 0.08)'
  },
  chartColors: {
    chart1: '142 70% 45%',
    chart2: '160 60% 50%',
    chart3: '130 65% 55%',
    chart4: '95 70% 45%',
    chart5: '180 70% 40%'
  }
};

// Dark version of blue theme
export const blueDarkTheme: ThemePreset = {
  id: 'blue-dark-theme',
  name: 'Blue Elegance Dark',
  description: 'Dark version of the Blue Elegance theme',
  colors: {
    background: '217 35% 10%',
    foreground: '214 100% 97%',
    card: '217 35% 15%',
    cardForeground: '214 100% 97%',
    border: '215 35% 25%',
    input: '217 35% 20%',
    primary: '215 90% 55%',
    primaryForeground: '210 40% 98%',
    secondary: '217 35% 20%',
    secondaryForeground: '214 100% 97%',
    accent: '215 80% 25%',
    accentForeground: '215 90% 70%',
    muted: '217 35% 18%',
    mutedForeground: '215 30% 70%',
    success: '145 65% 42%',
    successForeground: '0 0% 98%',
    warning: '38 95% 50%',
    warningForeground: '0 0% 12%',
    error: '0 90% 60%',
    errorForeground: '0 0% 98%',
    info: '215 90% 50%',
    infoForeground: '0 0% 98%',
    ring: '215 90% 35%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
  },
  chartColors: {
    chart1: '215 90% 60%',
    chart2: '230 80% 70%',
    chart3: '245 70% 80%',
    chart4: '200 85% 65%',
    chart5: '195 95% 55%'
  }
};

// Dark version of green theme
export const greenDarkTheme: ThemePreset = {
  id: 'green-dark-theme',
  name: 'Forest Vibes Dark',
  description: 'Dark version of the Forest Vibes theme',
  colors: {
    background: '150 30% 10%',
    foreground: '120 15% 97%',
    card: '150 30% 15%',
    cardForeground: '120 15% 97%',
    border: '150 30% 25%',
    input: '150 30% 20%',
    primary: '142 70% 45%',
    primaryForeground: '120 60% 98%',
    secondary: '150 30% 20%',
    secondaryForeground: '120 15% 97%',
    accent: '142 50% 25%',
    accentForeground: '142 70% 70%',
    muted: '150 30% 18%',
    mutedForeground: '120 10% 70%',
    success: '142 70% 45%',
    successForeground: '0 0% 98%',
    warning: '38 95% 50%',
    warningForeground: '0 0% 12%',
    error: '0 90% 60%',
    errorForeground: '0 0% 98%',
    info: '200 85% 50%',
    infoForeground: '0 0% 98%',
    ring: '142 70% 35%'
  },
  options: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
    shadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
  },
  chartColors: {
    chart1: '142 70% 55%',
    chart2: '160 60% 60%',
    chart3: '130 65% 65%',
    chart4: '95 70% 55%',
    chart5: '180 70% 50%'
  }
};

// Create context with default values
const ThemeCustomizationContext = createContext<ThemeCustomizationContextType>({
  currentTheme: defaultLightTheme,
  presets: [defaultLightTheme, defaultDarkTheme, blueTheme, blueDarkTheme, greenTheme, greenDarkTheme],
  addPreset: () => {},
  updatePreset: () => {},
  deletePreset: () => {},
  applyPreset: () => {},
  updateCurrentTheme: () => {},
  resetToDefault: () => {}
});

export const useThemeCustomization = () => useContext(ThemeCustomizationContext);

export const ThemeCustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(
    theme === 'dark' ? defaultDarkTheme : defaultLightTheme
  );
  const [presets, setPresets] = useState<ThemePreset[]>(() => {
    const savedPresets = localStorage.getItem('theme-presets');
    return savedPresets 
      ? JSON.parse(savedPresets) 
      : [defaultLightTheme, defaultDarkTheme, blueTheme, blueDarkTheme, greenTheme, greenDarkTheme];
  });

  // Apply theme changes to DOM
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  // Sync with theme mode changes
  useEffect(() => {
    // If we're using a default theme, switch between light/dark as needed
    if (currentTheme.id === 'default-light' && theme === 'dark') {
      setCurrentTheme(defaultDarkTheme);
    } else if (currentTheme.id === 'default-dark' && theme === 'light') {
      setCurrentTheme(defaultLightTheme);
    } 
    // Handle blue theme variations
    else if (currentTheme.id === 'blue-theme' && theme === 'dark') {
      setCurrentTheme(blueDarkTheme);
    } else if (currentTheme.id === 'blue-dark-theme' && theme === 'light') {
      setCurrentTheme(blueTheme);
    }
    // Handle green theme variations
    else if (currentTheme.id === 'green-theme' && theme === 'dark') {
      setCurrentTheme(greenDarkTheme);
    } else if (currentTheme.id === 'green-dark-theme' && theme === 'light') {
      setCurrentTheme(greenTheme);
    }
    // Handle custom themes by checking the background brightness
    else if (theme === 'dark' && !currentTheme.id.includes('dark')) {
      // Find a matching dark theme or keep current theme
      const baseName = currentTheme.id;
      const matchingDarkTheme = presets.find(p => p.id === `${baseName}-dark`);
      if (matchingDarkTheme) {
        setCurrentTheme(matchingDarkTheme);
      }
    } else if (theme === 'light' && currentTheme.id.includes('dark')) {
      // Find a matching light theme or keep current theme
      const baseName = currentTheme.id.replace('-dark', '');
      const matchingLightTheme = presets.find(p => p.id === baseName);
      if (matchingLightTheme) {
        setCurrentTheme(matchingLightTheme);
      }
    }
  }, [theme, currentTheme.id, presets]);

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('theme-presets', JSON.stringify(presets));
  }, [presets]);

  // Apply theme to DOM by setting CSS variables
  const applyThemeToDOM = (theme: ThemePreset) => {
    const root = document.documentElement;
    
    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply chart colors
    Object.entries(theme.chartColors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply options
    root.style.setProperty('--font-family', theme.options.fontFamily);
    root.style.setProperty('--radius', theme.options.borderRadius);
    root.style.setProperty('--shadow', theme.options.shadow);
  };

  // Add a new preset
  const addPreset = (preset: Omit<ThemePreset, 'id'>) => {
    const newPreset = {
      ...preset,
      id: `preset-${Date.now()}`
    };
    setPresets([...presets, newPreset]);
  };

  // Update an existing preset
  const updatePreset = (id: string, updates: Partial<ThemePreset>) => {
    setPresets(presets.map(preset => 
      preset.id === id ? { ...preset, ...updates } : preset
    ));
    
    // If updating the current theme, apply changes
    if (currentTheme.id === id) {
      setCurrentTheme(prev => ({ ...prev, ...updates }));
    }
  };

  // Delete a preset
  const deletePreset = (id: string) => {
    // Don't allow deleting default presets
    if (id === 'default-light' || id === 'default-dark') return;
    
    setPresets(presets.filter(preset => preset.id !== id));
    
    // If deleting the current theme, revert to default
    if (currentTheme.id === id) {
      resetToDefault();
    }
  };

  // Apply a preset by ID
  const applyPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      setCurrentTheme(preset);
    }
  };

  // Update the current theme without saving as a preset
  const updateCurrentTheme = (updates: Partial<ThemePreset>) => {
    setCurrentTheme(prev => {
      // Create a temporary theme with merged updates
      const updatedTheme = { ...prev, ...updates };
      
      // If colors or options are updated, merge them properly
      if (updates.colors) {
        updatedTheme.colors = { ...prev.colors, ...updates.colors };
      }
      
      if (updates.options) {
        updatedTheme.options = { ...prev.options, ...updates.options };
      }
      
      if (updates.chartColors) {
        updatedTheme.chartColors = { ...prev.chartColors, ...updates.chartColors };
      }
      
      return updatedTheme;
    });
  };

  // Reset to default theme based on current mode
  const resetToDefault = () => {
    setCurrentTheme(theme === 'dark' ? defaultDarkTheme : defaultLightTheme);
  };

  const contextValue = {
    currentTheme,
    presets,
    addPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    updateCurrentTheme,
    resetToDefault
  };

  return (
    <ThemeCustomizationContext.Provider value={contextValue}>
      {children}
    </ThemeCustomizationContext.Provider>
  );
}; 