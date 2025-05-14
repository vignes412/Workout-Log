import React from "react";
import { Box, IconButton, useMediaQuery, useTheme, Paper, Typography } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

interface HighlightMetricCardProps {
  value: number | string;
  label: string;
}

const HighlightMetricCard: React.FC<HighlightMetricCardProps> = React.memo(({ value, label }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 2,
        borderRadius: 2,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
        }
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontSize: isMobile ? "1.8rem" : "2.5rem",
          fontWeight: "bold",
          color: theme.palette.text.primary,
          mb: 1
        }}
      >
        {value}
      </Typography>
      <Typography 
        variant="body1"
        sx={{
          fontSize: isMobile ? "0.85rem" : "1rem",
          fontWeight: isMobile ? "500" : "normal",
          color: theme.palette.text.secondary
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
});

interface ChartCardProps {
  title?: string;
  children: React.ReactNode;
  onRefresh: () => void;
}

const ChartCard: React.FC<ChartCardProps> = React.memo(({ title, children, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
        }
      }}
    >
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        p: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      }}>
        {title && (
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            sx={{ 
              margin: 0,
              pl: 0.5
            }}
          >
            {title}
          </Typography>
        )}
        <IconButton 
          onClick={onRefresh} 
          size={isMobile ? "small" : "medium"} 
          sx={{ p: isMobile ? 0.5 : 1 }}
        >
          <RefreshIcon sx={{ 
            color: theme.palette.text.primary,
            fontSize: isMobile ? "1rem" : "1.25rem" 
          }} />
        </IconButton>
      </Box>
      <Box sx={{ 
        flex: '1 1 auto',
        p: 2,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </Box>
    </Paper>
  );
});

HighlightMetricCard.displayName = 'HighlightMetricCard';
ChartCard.displayName = 'ChartCard';

export { HighlightMetricCard, ChartCard };