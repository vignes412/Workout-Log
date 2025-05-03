import React from "react";
import { Typography, Box } from "@mui/material";
import { StatusCard, TrainMusclesCard, RestMusclesCard } from "./StatusCards";
import { HighlightMetricCard, ChartCard } from "./DashboardCards";
import WorkoutLogsTable from "../WorkoutLogsTable";
import MuscleGroupDistributionChart from "../charts/MuscleGroupDistributionChart";
import TodoList from "../TodoList";
import WorkoutSummaryTable from "../WorkoutSummaryTable";
import ProgressionFatigueChart from "../charts/ProgressionFatigueChart";
import ProgressionByMuscleChart from "../charts/ProgressionByMuscleChart";
import VolumeOverTimeChart from "../charts/VolumeOverTimeChart";
import FatigueByMuscleChart from "../charts/FatigueByMuscleChart";
import ProgressGoals from "../ProgressGoals";
import BodyWeightCard from "./BodyWeightCard";
import AchievementsCard from "../AchievementsCard";
import WeeklySummaryCard from "../WeeklySummaryCard";
import MonthlySummaryCard from "../MonthlySummaryCard";
import StreakTracker from "../StreakTracker";
import WorkoutFeaturesCard from "./WorkoutFeaturesCard";

// Helper component for creating draggable card headers
const CardHeader = ({ title }) => (
  <div className="card-header">
    <Typography variant="subtitle1" fontWeight="medium" sx={{ cursor: 'move', py: 1 }}>
      {title}
    </Typography>
  </div>
);

const DashboardWidgets = ({
  layout,
  logs,
  isOffline,
  exercises,
  readyToTrain,
  restMuscles,
  handleReloadLogs,
  handleReloadCharts,
  handleReloadSummary,
  bodyWeight,
  setBodyWeight,
  handleRecordWeight,
  lastRecordedDate,
  theme,
  isCustomizing
}) => {
  // Calculate total volume
  const totalVolume = logs?.reduce((p, c) => {
    const reps = parseFloat(c[3]) || 0;
    const weight = parseFloat(c[4]) || 0;
    return p + reps * weight;
  }, 0) || 0;

  // These components need to be direct children of the ResponsiveGridLayout
  // Each component must have a key prop that matches the layout item's i prop
  return [
    layout.visibility.status && (
      <div key="status" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Status" />}
        <StatusCard isOffline={isOffline} logsCount={logs?.length || 0} />
      </div>
    ),
    layout.visibility["workout-features"] && (
      <div key="workout-features" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Workout Features" />}
        <WorkoutFeaturesCard />
      </div>
    ),
    layout.visibility.train && (
      <div key="train" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Train" />}
        <TrainMusclesCard readyToTrain={readyToTrain} />
      </div>
    ),
    layout.visibility.rest && (
      <div key="rest" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Rest" />}
        <RestMusclesCard restMuscles={restMuscles} />
      </div>
    ),
    layout.visibility["workout-logs"] && (
      <div key="workout-logs" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Workout Logs" />}
        <ChartCard onRefresh={handleReloadLogs}>
          <WorkoutLogsTable
            logs={logs}
            isOffline={isOffline}
            exercises={exercises}
          />
        </ChartCard>
      </div>
    ),
    layout.visibility["muscle-distribution"] && (
      <div key="muscle-distribution" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Muscle Distribution" />}
        <ChartCard onRefresh={handleReloadCharts}>
          <MuscleGroupDistributionChart
            logs={logs}
            muscleGroups={(exercises || []).map(
              (exercise) => exercise.muscleGroup
            )}
          />
        </ChartCard>
      </div>
    ),
    layout.visibility["workout-count"] && (
      <div key="workout-count" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Workout Count" />}
        <HighlightMetricCard 
          value={logs?.length || 0} 
          label="Workouts logged" 
        />
      </div>
    ),
    layout.visibility["total-volume"] && (
      <div key="total-volume" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Total Volume" />}
        <HighlightMetricCard 
          value={totalVolume} 
          label="Total Volume logged" 
        />
      </div>
    ),
    layout.visibility["todo-list"] && (
      <div key="todo-list" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="To-Do List" />}
        <TodoList />
      </div>
    ),
    layout.visibility["workout-summary"] && (
      <div key="workout-summary" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Workout Summary" />}
        <ChartCard onRefresh={handleReloadSummary}>
          <WorkoutSummaryTable logs={logs} />
        </ChartCard>
      </div>
    ),
    layout.visibility["progression-fatigue"] && (
      <div key="progression-fatigue" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Progression & Fatigue" />}
        <ProgressionFatigueChart
          logs={logs || []}
          dailyMetrics={logs || []}
        />
      </div>
    ),
    layout.visibility["progression-muscle"] && (
      <div key="progression-muscle" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Progression by Muscle" />}
        <ProgressionByMuscleChart
          logs={logs || []}
          dailyMetrics={logs || []}
        />
      </div>
    ),
    layout.visibility["volume-over-time"] && (
      <div key="volume-over-time" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Volume Over Time" />}
        <VolumeOverTimeChart
          logs={logs || []}
          dates={(logs || []).map((log) => log.date)}
        />
      </div>
    ),
    layout.visibility["fatigue-by-muscle"] && (
      <div key="fatigue-by-muscle" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Fatigue by Muscle" />}
        <FatigueByMuscleChart
          logs={logs || []}
          muscleGroups={(exercises || []).map(
            (exercise) => exercise.muscleGroup
          )}
          onReadyToTrainUpdate={() => {}} // This will be handled in the main Dashboard
        />
      </div>
    ),
    layout.visibility["progress-goals"] && (
      <div key="progress-goals" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Progress Goals" />}
        <ProgressGoals logs={logs} />
      </div>
    ),
    layout.visibility["body-weight"] && (
      <div key="body-weight" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Body Weight" />}
        <BodyWeightCard 
          bodyWeight={bodyWeight}
          setBodyWeight={setBodyWeight}
          handleRecordWeight={handleRecordWeight}
          lastRecordedDate={lastRecordedDate}
        />
      </div>
    ),
    layout.visibility.achievements && (
      <div key="achievements" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Achievements" />}
        <AchievementsCard logs={logs} />
      </div>
    ),
    layout.visibility["weekly-summary"] && (
      <div key="weekly-summary" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Weekly Summary" />}
        <WeeklySummaryCard logs={logs} />
      </div>
    ),
    layout.visibility["monthly-summary"] && (
      <div key="monthly-summary" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Monthly Summary" />}
        <MonthlySummaryCard logs={logs} />
      </div>
    ),
    layout.visibility["streak-tracker"] && (
      <div key="streak-tracker" className="card" style={{ backgroundColor: theme.palette.background.paper }}>
        {isCustomizing && <CardHeader title="Streak Tracker" />}
        <StreakTracker logs={logs} />
      </div>
    )
  ].filter(Boolean); // Remove any false values (invisible components)
};

export default DashboardWidgets;