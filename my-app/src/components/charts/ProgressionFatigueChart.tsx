// src/components/charts/ProgressionFatigueChart.tsx
import React, { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';
import { useTheme, Box } from '@mui/material';
import { computeDailyMetrics } from '../../utils/computeDailyMetrics';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface ProgressionFatigueChartProps {
  logs?: [string, string, string, string, string, string, string?][];
}

const ProgressionFatigueChart: React.FC<ProgressionFatigueChartProps> = ({ logs = [] }) => {
  const theme = useTheme();
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        datasets: [{
          label: 'No Data Available',
          data: [],
          backgroundColor: theme.palette.primary.main,
        }]
      };
    }

    const muscleGroups = [...new Set(logs.map(log => log[1]))];
    
    // Get all metrics grouped by muscle
    const muscleMetrics = muscleGroups.map(muscleGroup => {
      // Filter metrics for this muscle group
      const groupMetrics = dailyMetrics.filter(metric => metric.muscleGroup === muscleGroup);
      
      // Calculate average progression rate for this muscle
      const avgProgressionRate = groupMetrics.reduce((sum, metric) => {
        const rate = metric.progressionRate === 'N/A' ? 0 : parseFloat(metric.progressionRate) || 0;
        return sum + rate;
      }, 0) / (groupMetrics.length || 1);
      
      // Calculate fatigue for this muscle
      // We'll use volume as a proxy for fatigue
      const recentLogs = logs.filter(log => log[1] === muscleGroup);
      let totalVolume = 0;
      
      recentLogs.forEach(log => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        totalVolume += reps * weight;
      });
      
      // Normalize fatigue to a percentage (0-100%)
      const maxVolumeThreshold = 5000; // Adjust based on your app's expected max volume
      const fatigue = Math.min((totalVolume / maxVolumeThreshold) * 100, 100);
      
      return {
        muscleGroup,
        x: fatigue,         // Fatigue (x-axis)
        y: avgProgressionRate, // Progression (y-axis)
      };
    });
    
    // Organize chart data
    return {
      datasets: [{
        label: 'Muscle Groups',
        data: muscleMetrics,
        backgroundColor: theme.palette.primary.main,
        pointRadius: 8,
        pointHoverRadius: 12,
      }],
    };
  }, [logs, dailyMetrics, theme.palette.primary.main]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = context.raw as any;
            return `${point.muscleGroup}: Fatigue ${point.x.toFixed(1)}%, Progression ${point.y.toFixed(1)}%`;
          }
        }
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: 'Progression vs. Fatigue by Muscle Group',
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
      // Add quadrant lines to visualize training zones
      quadrants: {
        topLeft: { text: 'Optimal Zone', color: 'rgba(75, 192, 192, 0.1)' },
        topRight: { text: 'Recovery Needed', color: 'rgba(255, 99, 132, 0.1)' },
        bottomLeft: { text: 'Training Needed', color: 'rgba(54, 162, 235, 0.1)' },
        bottomRight: { text: 'Overtraining Zone', color: 'rgba(255, 159, 64, 0.1)' },
        xThreshold: 50, // 50% fatigue threshold
        yThreshold: 10, // 10% progression threshold
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fatigue (%)',
          color: theme.palette.text.primary,
        },
        min: 0,
        max: 100,
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
      },
      y: {
        title: {
          display: true,
          text: 'Progression Rate (%)',
          color: theme.palette.text.primary,
        },
        min: -10,
        max: 30,
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
      },
    },
  }), [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.divider]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Scatter data={chartData} options={chartOptions} />
    </Box>
  );
};

export default React.memo(ProgressionFatigueChart);
