// Workout app style system based on style guidelines

export const theme = {
  // Typography
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    sizes: {
      pageTitle: '34px',
      sectionHeader: '24px',
      body: '16px',
      button: '15px',
      caption: '14px',
    },
    weights: {
      regular: 400,
      emphasis: 500,
      header: 600,
    },
    lineHeights: {
      header: 1.2,
      body: 1.5,
      button: 1.75,
    },
  },
  
  // Spacing & Dimensions
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  dimensions: {
    containers: {
      maxWidth: '1200px',
      cardMaxWidth: '400px',
      cardMinWidth: '280px',
    },
    breakpoints: {
      mobile: '600px',
      tablet: '960px',
    },
    padding: {
      card: '16px',
      section: '24px',
      form: '12px',
    },
    margins: {
      section: '32px',
      formElement: '16px',
      buttonTop: '8px',
    },
    grid: {
      columns: 12,
      gap: '16px',
    },
  },
  
  // Component styling
  components: {
    card: {
      borderRadius: '12px',
      shadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    button: {
      borderRadius: '4px',
      height: '36px',
      padding: '8px 16px',
    },
    input: {
      height: '56px',
      borderRadius: '4px',
    },
    progress: {
      circular: {
        size: '40px',
        thickness: '4px',
      },
      linear: {
        height: '4px',
      },
    },
  },
  
  // Page-specific
  pages: {
    login: {
      cardWidth: '400px',
    },
    dashboard: {
      headerHeight: '64px',
      sidebarWidth: '240px',
      sidebarCollapsedWidth: '64px',
      gridColumns: 4,
    },
    exerciseList: {
      cardWidth: '280px',
      imageRatio: '16/9',
    },
    workout: {
      exerciseRowHeight: '72px',
      setCounterHeight: '48px',
    },
  },
  
  // Responsive behavior
  responsive: {
    mobile: {
      maxWidth: '600px',
      fontScale: 0.875,
      gridColumns: 1,
    },
    tablet: {
      minWidth: '601px',
      maxWidth: '960px',
      padding: '16px',
      gridColumns: 2,
    },
    desktop: {
      minWidth: '961px',
      gridColumns: 4,
    },
  },
};
