import React from 'react';
import { Paper, Box, Typography, useTheme, SxProps, Theme } from '@mui/material';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  minHeight?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  sx?: SxProps<Theme>;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  id,
  title,
  children,
  minHeight = { xs: 200, sm: 220, md: 250 },
  sx = {}
}) => {
  const theme = useTheme();
  
  // Convert minHeight to appropriate format for sx prop
  const heightProps = typeof minHeight === 'number' 
    ? { minHeight } 
    : { 
        minHeight: {
          xs: minHeight.xs || 200,
          sm: minHeight.sm || 220,
          md: minHeight.md || 250,
          lg: minHeight.lg || 250
        }
      };
  
  return (
    <Paper
      elevation={1}
      id={`widget-${id}`}
      className={`dashboard-widget widget-${id}`}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        ...heightProps,
        ...sx
      }}
    >
      <Box
        className="widget-header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          pl: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography 
          variant="subtitle1" 
          fontWeight="medium"
          sx={{ margin: 0 }}
        >
          {title}
        </Typography>
      </Box>
      
      <Box 
        className="widget-content"
        sx={{ 
          flex: '1 1 auto',
          p: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start'
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default React.memo(DashboardWidget);