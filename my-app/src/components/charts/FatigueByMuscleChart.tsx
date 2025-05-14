import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";
import { computeDailyMetrics } from "../../utils/computeDailyMetrics";

interface FatigueByMuscleChartProps {
  logs: [string, string, string, string, string, string, string?][];
  onReadyToTrainUpdate?: (musclesReady: string[], musclesNeeded: string[]) => void;
}

const FatigueByMuscleChart: React.FC<FatigueByMuscleChartProps> = React.memo(({ logs, onReadyToTrainUpdate }) => {
  const theme = useTheme();
  const daysAgo = 3;
  const trainMuscle = 8;
  
  // Memoize metrics calculation to prevent recomputing on every render
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  // Memoize all data processing in a single useMemo to prevent cascading updates
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) {
      // Return empty data structure
      return {
        muscleGroups: [],
        fatigueByMuscle: [],
        musclesToWorkout: [],
        musclesNeeded: []
      };
    }

    // Extract unique muscle groups
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];
    
    // Calculate max threshold for volume
    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
      return Math.max(max, dateVolume);
    }, 1);

    // Get logs from last X days
    const currentDate = new Date();
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(currentDate.getDate() - daysAgo);

    const recentLogs = logs.filter((log) => {
      const [day, month, year] = log[0].split("/");
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= threeDaysAgo && logDate <= currentDate;
    });

    // Calculate fatigue for each muscle group
    const fatigueByMuscle = muscleGroups.map((group) => {
      const groupLogs = recentLogs.filter((log) => log[1] === group);
      const totalVolume = groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
      const fatigue = (totalVolume / maxThreshold) * 100 || 0;
      return { muscleGroup: group, fatigue: Math.min(fatigue, 200) };
    });

    // Determine which muscles are ready to workout vs need rest
    const musclesToWorkout = fatigueByMuscle
      .filter((m) => m.fatigue < trainMuscle)
      .map((m) => m.muscleGroup);

    const musclesNeeded = fatigueByMuscle
      .filter((m) => m.fatigue > trainMuscle)
      .map((m) => m.muscleGroup);

    // Call update function if provided, but only once during processing
    if (onReadyToTrainUpdate) {
      // We defer the callback to avoid React update during render
      setTimeout(() => {
        onReadyToTrainUpdate(musclesToWorkout, musclesNeeded);
      }, 0);
    }

    return {
      muscleGroups,
      fatigueByMuscle,
      musclesToWorkout,
      musclesNeeded
    };
  }, [logs, daysAgo, trainMuscle, onReadyToTrainUpdate, dailyMetrics]);

  // Memoize chart data
  const chartData = useMemo(() => ({
    labels: processedData.muscleGroups,
    datasets: [
      {
        label: "Fatigue (%) - Per Muscle Group",
        data: processedData.fatigueByMuscle.map((m) => m.fatigue),
        backgroundColor: `${theme.palette.error.main}99`,
        borderColor: theme.palette.error.main,
        borderWidth: 1,
      },
    ],
  }), [processedData.muscleGroups, processedData.fatigueByMuscle, theme.palette.error.main]);

  // Memoize chart options
  const chartOptions = useMemo(() => ({
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
        text: "Fatigue per Muscle Group",
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
          text: "Fatigue (%)",
          color: theme.palette.text.primary,
        },
      },
    },
  }), [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.divider]);

  return (
    <Box className="chart-wrapper" sx={{ height: 350 }}>
      <Bar data={chartData} options={chartOptions} />
    </Box>
  );
});

FatigueByMuscleChart.displayName = 'FatigueByMuscleChart';

export default FatigueByMuscleChart;
