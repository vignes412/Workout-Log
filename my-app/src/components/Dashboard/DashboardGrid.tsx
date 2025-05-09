import React, { useMemo } from 'react';
import { Box, useTheme, Typography, Grid, Paper } from '@mui/material';
import { WIDGET_IDS } from './dashboardUtils';
import { useDashboard } from '../../context/DashboardContext';

interface DashboardGridProps {
  children?: React.ReactNode;
}

// Define the type for the widget sizes
interface WidgetSizeConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
}

// Widget size definitions based on widget type
const WIDGET_SIZES: Record<string, WidgetSizeConfig> = {
  // Full width widgets
  "workout-logs": { xs: 12, sm: 12, md: 12, lg: 12 },
  "workout-summary-table": { xs: 12, sm: 12, md: 12, lg: 12 },
  
  // Half width widgets
  "muscle-distribution": { xs: 12, sm: 12, md: 6, lg: 6 },
  "volume-over-time": { xs: 12, sm: 12, md: 6, lg: 6 },
  "progression-muscle": { xs: 12, sm: 12, md: 6, lg: 6 },
  "fatigue-by-muscle": { xs: 12, sm: 12, md: 6, lg: 6 },
  "progression-fatigue": { xs: 12, sm: 12, md: 6, lg: 6 },
  "workout-summary": { xs: 12, sm: 6, md: 6, lg: 6 },
  "todo-list": { xs: 12, sm: 6, md: 6, lg: 6 },
  "weekly-summary": { xs: 12, sm: 6, md: 6, lg: 6 },
  "monthly-summary": { xs: 12, sm: 6, md: 6, lg: 6 },
  
  // Small widgets
  "status": { xs: 12, sm: 6, md: 4, lg: 3 },
  "train": { xs: 12, sm: 6, md: 4, lg: 3 },
  "rest": { xs: 12, sm: 6, md: 4, lg: 3 },
  "workout-count": { xs: 12, sm: 6, md: 4, lg: 3 },
  "total-volume": { xs: 12, sm: 6, md: 4, lg: 3 },
  "progress-goals": { xs: 12, sm: 6, md: 4, lg: 3 },
  "body-weight": { xs: 12, sm: 6, md: 4, lg: 3 },
  "achievements": { xs: 12, sm: 6, md: 4, lg: 3 },
  "streak-tracker": { xs: 12, sm: 6, md: 4, lg: 3 },
  "workout-features": { xs: 12, sm: 6, md: 4, lg: 3 },
};

// Default widget size
const DEFAULT_WIDGET_SIZE: WidgetSizeConfig = { xs: 12, sm: 6, md: 4, lg: 3 };

// Dynamic height based on widget type
const getWidgetHeight = (id: string): Record<string, any> => {
  // Chart widgets need more height
  if ([
    "muscle-distribution", 
    "volume-over-time", 
    "progression-muscle", 
    "fatigue-by-muscle", 
    "progression-fatigue"
  ].includes(id)) {
    return { 
      minHeight: {
        xs: 300,
        sm: 350,
        md: 380
      }
    };
  }
  
  // Full width tables need moderate height
  if (["workout-logs", "workout-summary-table"].includes(id)) {
    return { 
      minHeight: {
        xs: 300,
        sm: 320,
        md: 350
      }
    };
  }
  
  // Small widgets need less height
  if ([
    "status", 
    "train", 
    "rest", 
    "workout-count", 
    "total-volume", 
    "body-weight", 
    "streak-tracker"
  ].includes(id)) {
    return { 
      minHeight: {
        xs: 120,
        sm: 150,
        md: 180
      }
    };
  }
  
  // Default height for other widgets
  return { 
    minHeight: {
      xs: 180,
      sm: 200,
      md: 220
    }
  };
};

const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
  const theme = useTheme();
  const { layout, isCustomizing } = useDashboard();
  
  // Customizing mode indicator
  const customizingIndicator = useMemo(() => {
    if (!isCustomizing) return null;
    
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'primary.main',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          zIndex: 1000,
          boxShadow: 3,
        }}
      >
        <Typography variant="body2">
          Dashboard Customization Mode
        </Typography>
      </Box>
    );
  }, [isCustomizing]);

  if (!children) return null;
  
  // Get all widgets as an array
  const allWidgets = React.Children.toArray(children);
  
  // Filter widgets based on visibility settings and map to grid items
  const visibleWidgetComponents = WIDGET_IDS
    .filter(id => layout.visibility[id])
    .map(id => {
      const widgetComponent = allWidgets.find((_, index) => 
        WIDGET_IDS[index] === id
      );
      
      // Get responsive sizing for this widget type or use default
      const size = WIDGET_SIZES[id] || DEFAULT_WIDGET_SIZE;
      
      // Get appropriate height for this widget type
      const heightProps = getWidgetHeight(id);
      
      return (
        <Grid 
          item 
          xs={size.xs}
          sm={size.sm}
          md={size.md}
          lg={size.lg}
          key={id} 
          sx={{
            display: 'flex',
            height: '100%',
            ...heightProps
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              padding: 0,
              margin: 0,
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              overflow: 'hidden',
              borderRadius: 2,
              transition: theme.transitions.create(['transform', 'box-shadow'], {
                duration: theme.transitions.duration.standard,
              }),
              ...(isCustomizing && {
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  cursor: 'grab'
                },
              }),
            }}
          >
            {widgetComponent || (
              <Paper 
                elevation={1}
                sx={{ 
                  height: '100%', 
                  width: '100%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: isCustomizing ? `1px dashed ${theme.palette.divider}` : 'none',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {id} widget
                </Typography>
              </Paper>
            )}
          </Box>
        </Grid>
      );
    });

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {customizingIndicator}
      
      <Box sx={{ 
        width: '100%',
        position: 'relative',
        minHeight: 500,
        paddingBottom: '80px', 
        overflow: 'visible'
      }}>
        <Grid container spacing={2}>
          {visibleWidgetComponents}
        </Grid>
      </Box>
    </Box>
  );
};

// Add display name for debugging
DashboardGrid.displayName = 'DashboardGrid';

export default DashboardGrid;