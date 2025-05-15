// CSS Variables for chart theming with robust fallbacks
export const CHART_COLORS = {
  volume: "hsl(var(--chart-1, 221 83% 53%))",
  fatigue: "hsl(var(--chart-2, 0 84% 60%))",
  distribution: "hsl(var(--chart-3, 160 84% 39%))",
  relativeVolume: "hsl(var(--chart-4, 270 76% 64%))", 
  recentFatigue: "hsl(var(--chart-5, 24 94% 55%))",
  progression: "hsl(var(--primary, 204 94% 48%))",
  // Secondary colors with better contrast for dark mode
  stroke: "hsl(var(--card-foreground, 0 0% 98%))",
  gridLines: "hsl(var(--border, 0 0% 89.8%))",
  text: "hsl(var(--foreground, 0 0% 98%))"
};

// Common tooltip style with improved contrast for dark mode
export const TOOLTIP_STYLE = { 
  backgroundColor: 'hsl(var(--popover))',
  borderColor: 'hsl(var(--border))',
  borderRadius: 'var(--radius)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  padding: '8px 12px'
};
