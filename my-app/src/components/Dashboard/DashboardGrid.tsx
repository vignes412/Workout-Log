import React, { ReactElement, useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useDashboard } from '../../context/DashboardContext';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/styles.css';
import { DashboardWidgetId } from './dashboardUtils';

// Create a responsive grid layout with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Define the expected shape of the props for children of DashboardGrid
interface WidgetChildProps {
  id: string;
  [key: string]: any;
}

interface DashboardGridProps {
  children: React.ReactNode | React.ReactNode[];
}

// Type guard function to check if an element has an id prop
function hasIdProp(element: React.ReactElement<any>): element is React.ReactElement<WidgetChildProps> {
  return element.props && 'id' in element.props;
}

// Define the initial layouts for different breakpoints
const generateLayouts = (children: React.ReactNode[], isCustomizing: boolean) => {
  const layouts = {
    lg: [] as any[],
    md: [] as any[],
    sm: [] as any[],
    xs: [] as any[]
  };

  let lgY = 0;
  let mdY = 0;
  let smY = 0;
  let xsY = 0;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const element = child as ReactElement;
      if (hasIdProp(element)) {
        const widgetId = element.props.id;
        
        // Determine sizes based on widget type
        let lgW = 6; // Default to half width on large screens
        let lgH = 4;
        
        // Special case for widgets that should be full width
        const fullWidthWidgets = [
          'workout-logs',
          'workout-summary-table',
          'volume-over-time',
          'fatigue-by-muscle',
          'progression-fatigue'
        ];
        
        // Special case for widgets that should be half width
        const halfWidthWidgets = [
          'progression-muscle',
          'muscle-distribution',
          'workout-summary',
          'weekly-summary',
          'monthly-summary'
        ];
        
        // Special case for widgets that should be quarter width
        const quarterWidthWidgets = [
          'status',
          'train',
          'rest',
          'workout-count',
          'total-volume',
          'streak-tracker'
        ];
        
        if (quarterWidthWidgets.includes(widgetId)) {
          lgW = 3;
          lgH = 3;
        } else if (fullWidthWidgets.includes(widgetId)) {
          lgW = 12;
          lgH = 6;
        } else if (halfWidthWidgets.includes(widgetId)) {
          lgW = 6;
          lgH = 5;
        }
        
        // Define layout for large screens
        layouts.lg.push({
          i: widgetId,
          x: lgW === 12 ? 0 : (layouts.lg.length % (12 / lgW)) * lgW,
          y: lgY,
          w: lgW,
          h: lgH,
          isResizable: isCustomizing,
          isDraggable: isCustomizing
        });
        
        if ((layouts.lg.length % (12 / lgW) === (12 / lgW) - 1) || lgW === 12) {
          lgY += lgH;
        }
        
        // Define layout for medium screens
        let mdW = lgW === 3 ? 4 : (lgW === 6 ? 6 : 12);
        layouts.md.push({
          i: widgetId,
          x: mdW === 12 ? 0 : (layouts.md.length % (12 / mdW)) * mdW,
          y: mdY,
          w: mdW,
          h: lgH,
          isResizable: isCustomizing,
          isDraggable: isCustomizing
        });
        
        if ((layouts.md.length % (12 / mdW) === (12 / mdW) - 1) || mdW === 12) {
          mdY += lgH;
        }
        
        // Define layout for small screens
        let smW = lgW === 3 ? 6 : 12;
        layouts.sm.push({
          i: widgetId,
          x: smW === 12 ? 0 : (layouts.sm.length % (12 / smW)) * smW,
          y: smY,
          w: smW,
          h: lgH,
          isResizable: isCustomizing,
          isDraggable: isCustomizing
        });
        
        if ((layouts.sm.length % (12 / smW) === (12 / smW) - 1) || smW === 12) {
          smY += lgH;
        }
        
        // Define layout for extra small screens
        layouts.xs.push({
          i: widgetId,
          x: 0,
          y: xsY,
          w: 12,
          h: lgH,
          isResizable: isCustomizing,
          isDraggable: isCustomizing
        });
        
        xsY += lgH;
      }
    }
  });

  return layouts;
};

const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.up('sm'));
  
  const { layout: dashboardLayout, isCustomizing, saveLayout } = useDashboard();
  
  // Filter children based on visibility settings
  const visibleChildren = React.Children.toArray(children).filter((child) => {
    if (React.isValidElement(child)) {
      const element = child as ReactElement;
      if (hasIdProp(element)) {
        const widgetId = element.props.id;
        // Fix the type error by using type assertion to DashboardWidgetId
        return dashboardLayout.visibility[widgetId as DashboardWidgetId];
      }
    }
    return true;
  });

  // Generate layouts based on visible children
  const [layouts, setLayouts] = useState(() => generateLayouts(visibleChildren, isCustomizing));

  // Update layouts when children or customizing mode changes
  useEffect(() => {
    setLayouts(generateLayouts(visibleChildren, isCustomizing));
  }, [visibleChildren, isCustomizing]);

  // Handle layout change
  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    if (isCustomizing) {
      setLayouts(allLayouts);
    }
  };

  const getCurrentBreakpoint = () => {
    if (isLargeScreen) return 'lg';
    if (isMediumScreen) return 'md';
    if (isSmallScreen) return 'sm';
    return 'xs';
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        p: 0,
        mt: 1,
        height: '100%',
        overflowX: 'hidden'
      }}
    >
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        isDraggable={isCustomizing}
        isResizable={isCustomizing}
        useCSSTransforms={true}
      >
        {React.Children.map(visibleChildren, (child) => {
          if (React.isValidElement(child)) {
            const element = child as ReactElement;
            if (hasIdProp(element)) {
              const widgetId = element.props.id;
              return (
                <div key={widgetId} className="dashboard-item">
                  <Box
                    sx={{
                      height: '100%',
                      transition: isCustomizing ? 'all 0.3s ease-in-out' : 'none',
                      '&:hover': isCustomizing ? { 
                        transform: 'scale(1.01)',
                        zIndex: 1
                      } : {},
                      background: theme.palette.background.paper,
                      borderRadius: 2,
                      boxShadow: theme.shadows[1],
                      overflow: 'hidden'
                    }}
                  >
                    {child}
                  </Box>
                </div>
              );
            }
          }
          return null;
        })}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default React.memo(DashboardGrid);