import React, { useCallback, ReactElement } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { Box, Paper, useTheme } from '@mui/material';
import { useDashboard } from '../../context/DashboardContext';
import DashboardWidget from './DashboardWidget';
import { DashboardWidgetId, getWidgetTitle } from './dashboardUtils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Create responsive grid using width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Props interface for the component
interface ResponsiveDashboardGridProps {
  children?: React.ReactNode;
  onLayoutChange?: (layout: Layout[], allLayouts: Layouts) => void;
}

// Helper to get the id from a child element
const getWidgetIdFromChild = (child: React.ReactNode): string | null => {
  if (React.isValidElement(child)) {
    // Use type assertion to access props.id safely
    return (child as React.ReactElement<{ id?: string }>).props.id || null;
  }
  return null;
};

// Component for responsive dashboard grid
const ResponsiveDashboardGrid: React.FC<ResponsiveDashboardGridProps> = ({ 
  children,
  onLayoutChange 
}) => {
  const theme = useTheme();
  
  // Access dashboard context
  const { 
    layout,
    isCustomizing,
    saveLayout
  } = useDashboard();

  // Handle layout changes
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    if (isCustomizing) {
      saveLayout(allLayouts);
    }
    
    if (onLayoutChange) {
      onLayoutChange(currentLayout, allLayouts);
    }
  }, [isCustomizing, saveLayout, onLayoutChange]);

  // Filter visible widgets with proper typing
  const visibleWidgets = Object.keys(layout.visibility || {})
    .filter(id => layout.visibility[id as DashboardWidgetId])
    .map(id => id as DashboardWidgetId);

  // Create a map of widget children by ID for quick lookup
  const widgetChildrenMap = React.useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    
    React.Children.forEach(children, child => {
      const widgetId = getWidgetIdFromChild(child);
      if (widgetId) {
        map[widgetId] = child;
      }
    });
    
    return map;
  }, [children]);

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '80vh',
      '& .react-grid-item.react-grid-placeholder': {
        backgroundColor: theme.palette.primary.light,
        opacity: 0.2
      }
    }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layout.layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={isCustomizing}
        isResizable={isCustomizing}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {visibleWidgets.map(widgetId => {
          // Get the corresponding child for this widget ID if it exists
          const widgetChild = widgetChildrenMap[widgetId];
          
          return (
            <Paper
              key={widgetId}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                border: isCustomizing 
                  ? `2px dashed ${theme.palette.primary.main}` 
                  : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: isCustomizing 
                    ? `0px 0px 0px 2px ${theme.palette.primary.main}` 
                    : theme.shadows[3]
                }
              }}
              elevation={isCustomizing ? 0 : 1}
            >
              <DashboardWidget
                id={widgetId}
                title={getWidgetTitle(widgetId)}
              >
                {widgetChild || <Box sx={{ p: 2 }}>Widget content for {widgetId}</Box>}
              </DashboardWidget>
            </Paper>
          );
        })}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default React.memo(ResponsiveDashboardGrid);