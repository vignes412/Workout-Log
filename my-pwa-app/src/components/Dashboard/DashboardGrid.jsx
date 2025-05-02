import React from "react";
import { useTheme } from "@mui/material";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardGrid = ({ 
  layouts, 
  isCustomizing, 
  handleLayoutChange,
  children 
}) => {
  const theme = useTheme();

  return (
    <div className="dashboard-grid-container">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 960, sm: 600, xs: 480 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 4 }}
        rowHeight={30}
        onLayoutChange={(currentLayout, allLayouts) => 
          handleLayoutChange(currentLayout, allLayouts)
        }
        isResizable={isCustomizing}
        isDraggable={isCustomizing}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[8, 8]}
        resizeHandles={['se']}
        // Mobile optimization
        useCSSTransforms={true}
        measureBeforeMount={false}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardGrid;