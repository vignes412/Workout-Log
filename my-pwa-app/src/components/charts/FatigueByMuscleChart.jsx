import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";
import { computeDailyMetrics } from "../../utils/computeDailyMetrics";

const FatigueByMuscleChart = ({ logs }) => {
  const theme = useTheme();
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        dates: [],
        muscleGroups: [],
        fatigueData: [],
        progressionData: [],
        fatigueByMuscle: [],
        fatigueTrend: { rest: "None", workout: "None" },
        volumeOverTime: [],
        muscleGroupDistributionPercent: [],
      };
    }

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];

    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return Math.max(max, dateVolume);
    }, 1);

    const currentDate = new Date();
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(currentDate.getDate() - 3);

    const last10DaysLogs = logs.filter((log) => {
      const [day, month, year] = log[0].split("/");
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= threeDaysAgo && logDate <= currentDate;
    });

    const fatigueByMuscle = muscleGroups.map((group) => {
      const groupLogs = last10DaysLogs.filter((log) => log[1] === group);
      const totalVolume = groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      const fatigue = (totalVolume / maxThreshold) * 100 || 0;
      return { muscleGroup: group, fatigue: Math.min(fatigue, 200) };
    });

    console.log("Fatigue by Muscle Group (Volume-Based):", fatigueByMuscle);

    const musclesToRest = fatigueByMuscle
      .filter((m) => m.fatigue > 30)
      .map((m) => m.muscleGroup);

    const musclesToWorkout = fatigueByMuscle
      .filter((m) => m.fatigue < 10)
      .map((m) => m.muscleGroup);

    const overallFatigueTrend = {
      rest: musclesToRest.length > 0 ? musclesToRest.join(", ") : "None",
      workout:
        musclesToWorkout.length > 0 ? musclesToWorkout.join(", ") : "None",
    };

    const fatigueData = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return (dateVolume / maxThreshold) * 100 || 0;
    });

    const progressionData = dates.map((date) => {
      const dayMetrics = dailyMetrics.filter((metric) => metric.date === date);
      const progressionRates = dayMetrics.map((metric) =>
        metric.progressionRate === "N/A"
          ? 0
          : parseFloat(metric.progressionRate) || 0
      );
      return (
        progressionRates.reduce((sum, rate) => sum + rate, 0) /
        (progressionRates.length || 1)
      );
    });

    const progressionByMuscle = muscleGroups.map((group) => {
      const groupMetrics = dailyMetrics.filter(
        (metric) => metric.muscleGroup === group
      );
      const avgProgressionRate =
        groupMetrics.reduce((sum, metric) => {
          const rate =
            metric.progressionRate === "N/A"
              ? 0
              : parseFloat(metric.progressionRate) || 0;
          return sum + rate;
        }, 0) / (groupMetrics.length || 1);
      return { muscleGroup: group, avgProgressionRate };
    });

    console.log("Progression Rate by Muscle Group:", progressionByMuscle);

    const volumeOverTime = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      return dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    const muscleGroupDistribution = muscleGroups.map((group) => {
      const groupLogs = logs.filter((log) => log[1] === group);
      return groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    const totalVolume = muscleGroupDistribution.reduce(
      (sum, volume) => sum + volume,
      0
    );
    const muscleGroupDistributionPercent = muscleGroupDistribution.map(
      (volume) => (volume / totalVolume) * 100 || 0
    );

    return {
      dates,
      muscleGroups,
      fatigueData,
      progressionData,
      fatigueByMuscle,
      fatigueTrend: overallFatigueTrend,
      progressionByMuscle,
      volumeOverTime,
      muscleGroupDistributionPercent,
    };
  }, [logs, dailyMetrics]);
  const fatigueByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Fatigue (%) - Per Muscle Group",
        data: processedData.fatigueByMuscle?.map((m) => m.fatigue) || [],
        backgroundColor: `${theme.palette.error.main}99`,
        borderColor: theme.palette.error.main,
        borderWidth: 1,
      },
    ],
  };
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
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
  };

  return (
    <Box className="chart-wrapper" style={{ height: 350 }}>
      {/* Adjusted height */}
      <Bar data={fatigueByMuscleData} options={barChartOptions} />
    </Box>
  );
};

export default FatigueByMuscleChart;
