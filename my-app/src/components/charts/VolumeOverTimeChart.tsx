import React, { useMemo, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { useTheme, Box, Typography } from "@mui/material";

interface VolumeOverTimeChartProps {
  logs: any[]; // Accept any array format
  dates?: any[]; // Add optional dates prop
}

const VolumeOverTimeChart: React.FC<VolumeOverTimeChartProps> = ({ logs, dates: propDates }) => {
  const theme = useTheme();
  
  // Debug logs
  useEffect(() => {
    console.log("VolumeOverTimeChart received logs:", logs);
  }, [logs]);
  
  // Extract dates from logs
  const dates = useMemo(() => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.log("No logs data for volume over time chart");
      return [];
    }
    
    try {
      // Try to extract dates from logs, handling different formats
      const extractedDates = [...new Set(logs.map((log) => {
        if (Array.isArray(log)) {
          return log[0] || ""; // Access date from array
        } else if (typeof log === 'object' && log !== null) {
          return (log as any).date || ""; // Access date from object
        }
        return "";
      }))].filter(date => date).sort();
      
      return extractedDates;
    } catch (error) {
      console.error("Error extracting dates:", error);
      return [];
    }
  }, [logs]);

  const volumeOverTimeData = useMemo(() => {
    if (!dates.length) {
      return null;
    }
    
    try {
      const volumeOverTime = dates.map((date) => {
        const dateLogs = logs.filter((log) => {
          if (Array.isArray(log)) {
            return log[0] === date;
          } else if (typeof log === 'object' && log !== null) {
            return (log as any).date === date;
          }
          return false;
        });
        
        return dateLogs.reduce((sum, log) => {
          const reps = parseFloat(Array.isArray(log) ? log[3] : (log as any).reps) || 0;
          const weight = parseFloat(Array.isArray(log) ? log[4] : (log as any).weight) || 0;
          return sum + reps * weight;
        }, 0);
      });

      return {
        labels: dates,
        datasets: [
          {
            label: "Total Volume",
            data: volumeOverTime,
            borderColor: theme.palette.info.main,
            backgroundColor: `${theme.palette.info.main}33`,
            tension: 0.3,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating volume over time data:", error);
      return null;
    }
  }, [logs, dates, theme.palette.info.main]);

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: "Volume Over Time",
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
      },
      y: {
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Volume",
          color: theme.palette.text.primary,
        },
      },
    },
  }), [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.divider]);

  if (!volumeOverTimeData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
        <Typography variant="body1" color="text.secondary">
          No data available for volume over time chart
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="chart-wrapper" sx={{ height: 350 }}>
      <Line data={volumeOverTimeData} options={lineChartOptions} />
    </Box>
  );
};

export default React.memo(VolumeOverTimeChart);
