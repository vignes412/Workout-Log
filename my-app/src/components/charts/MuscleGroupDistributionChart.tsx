import React, { useMemo, useCallback } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useTheme, Box, Typography, Paper } from "@mui/material";

// Register Chart.js components only once
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

interface MuscleGroupDistributionChartProps {
  logs: any[]; // Accept any array format
  muscleGroups?: string[]; // Optional muscle groups
}

// Memoized utility functions to improve performance
const extractMuscleGroups = (logs: any[]): string[] => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return [];
  }
  
  const groups = new Set<string>();
  
  logs.forEach(log => {
    let muscleGroup: string;
    
    if (Array.isArray(log)) {
      muscleGroup = log[1] || "Unknown";
    } else if (typeof log === 'object' && log !== null) {
      muscleGroup = (log as any).muscleGroup || "Unknown";
    } else {
      muscleGroup = "Unknown";
    }
    
    groups.add(muscleGroup);
  });
  
  return Array.from(groups);
};

// Extract value from log entry based on format
const getLogValue = (log: any, key: string, defaultValue: any = 0): any => {
  if (Array.isArray(log)) {
    switch (key) {
      case 'date': return log[0];
      case 'muscleGroup': return log[1];
      case 'exercise': return log[2];
      case 'reps': return parseFloat(log[3]) || defaultValue;
      case 'weight': return parseFloat(log[4]) || defaultValue;
      case 'howIFeel': return parseFloat(log[5]) || defaultValue;
      default: return defaultValue;
    }
  } else if (typeof log === 'object' && log !== null) {
    return log[key] !== undefined ? log[key] : defaultValue;
  }
  return defaultValue;
};

const MuscleGroupDistributionChart: React.FC<MuscleGroupDistributionChartProps> = React.memo(({ logs, muscleGroups: propMuscleGroups }) => {
  const theme = useTheme();
  
  // Extract muscle groups with memoized function
  const muscleGroups = useMemo(() => {
    const extractedGroups = extractMuscleGroups(logs);
    return extractedGroups.length > 0 ? extractedGroups : (propMuscleGroups || []);
  }, [logs, propMuscleGroups]);

  // Calculate chart data with memoization
  const muscleGroupDistributionData = useMemo(() => {
    if (!logs || !Array.isArray(logs) || logs.length === 0 || muscleGroups.length === 0) {
      return null;
    }
    
    try {
      // Create distribution data by muscle group
      const distribution = muscleGroups.map(group => {
        // Filter logs by muscle group
        const groupLogs = logs.filter(log => 
          getLogValue(log, 'muscleGroup') === group
        );
        
        // Calculate volume per muscle group
        return groupLogs.reduce((sum, log) => {
          const reps = getLogValue(log, 'reps', 0);
          const weight = getLogValue(log, 'weight', 0);
          return sum + (reps * weight);
        }, 0);
      });

      // Calculate total volume
      const totalVolume = distribution.reduce((sum, volume) => sum + volume, 0) || 1;
      
      // Calculate percentages
      const percentages = distribution.map(volume => (volume / totalVolume) * 100);

      // Theme-aware colors
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        '#9c27b0', // purple
        '#795548', // brown
        '#607d8b', // blue grey
        '#009688', // teal
      ];

      return {
        labels: muscleGroups,
        datasets: [
          {
            label: "Volume Distribution (%)",
            data: percentages,
            backgroundColor: colors.map(color => `${color}40`), // 25% opacity
            borderColor: colors,
            borderWidth: 1.5,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating muscle group distribution data:", error);
      return null;
    }
  }, [logs, muscleGroups, theme]);

  // Chart options with theme integration - Fixed type issues
  const radarChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme.palette.text.primary,
          font: { size: 12 },
          boxWidth: 12,
          padding: 8
        },
        display: false // Hide legend for better space utilization
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.raw.toFixed(1)}%`;
          }
        },
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        boxPadding: 3
      }
    },
    scales: {
      // Fixed: Changed 'r' to properly typed RadialLinearScale options
      r: {
        angleLines: { color: theme.palette.divider },
        grid: { color: theme.palette.divider },
        pointLabels: { 
          color: theme.palette.text.primary,
          font: { 
            size: 11,
            weight: 'bold' as const // Fixed: Use 'bold' as const
          },
          padding: 4
        },
        ticks: {
          display: false, // Hide ticks for cleaner appearance
          backdropColor: 'transparent'
        },
        beginAtZero: true
      }
    },
    elements: {
      line: {
        tension: 0.4, // Smooth lines for better appearance
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        borderWidth: 2,
        hoverBorderWidth: 2,
        borderColor: theme.palette.background.paper,
        hoverBorderColor: theme.palette.background.paper,
      }
    },
    animation: {
      duration: 500 // Faster animations for performance
    }
  }), [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.divider, theme.palette.background.paper, theme.palette.mode]);

  // Empty state handling
  if (!muscleGroupDistributionData) {
    return (
      <Paper 
        elevation={1}
        sx={{ 
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data available for muscle group distribution
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={1}
      sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        p: 0,
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          Muscle Group Distribution
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          flex: 1, 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 0 // This is important for the chart to resize properly
        }}
      >
        <Radar data={muscleGroupDistributionData} options={radarChartOptions} />
      </Box>
    </Paper>
  );
});

MuscleGroupDistributionChart.displayName = 'MuscleGroupDistributionChart';

export default MuscleGroupDistributionChart;
