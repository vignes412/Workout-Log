// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import {
  useTheme,
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Fab,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Badge,
  Snackbar,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import {
  initClient,
  syncData,
  useOnlineStatus,
  appendData,
} from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import SettingsModal from "./SettingsModal";
import ProgressGoals from "./ProgressGoals";
import ProgressionFatigueChart from "./charts/ProgressionFatigueChart";
import ProgressionByMuscleChart from "./charts/ProgressionByMuscleChart";
import VolumeOverTimeChart from "./charts/VolumeOverTimeChart";
import MuscleGroupDistributionChart from "./charts/MuscleGroupDistributionChart";
import FatigueByMuscleChart from "./charts/FatigueByMuscleChart";
import TodoList from "./TodoList";
import {
  Add,
  Brightness4,
  Brightness7,
  FitnessCenter,
  Settings,
  Menu as MenuIcon,
  Search,
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Message as MessagesIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import shouldeIcon from "../assets/shoulder.png";
import absIcon from "../assets/Abdominals.png";
import ChestIcon from "../assets/chest.png";
import TricepsIcon from "../assets/triceps.png";
import trapeziusIcon from "../assets/trapezius.png";
import bicepsIcon from "../assets/biceps.png";
import forearmIcon from "../assets/forearm.png";
import calfIcon from "../assets/calf.png";
import HipIcon from "../assets/Hip.png";
import backWingsIcon from "../assets/back-wings.png";
import neckIcon from "../assets/neck.png";
import LegIcon from "../assets/leg.png";
import NotListedLocationIcon from "../assets/back (4).png";
import WorkoutLogsTable from "./WorkoutLogsTable";
import WorkoutSummaryTable from "./WorkoutSummaryTable";
import { useAppState } from "../index";
import { generateInsights } from "../utils/aiInsights";
import AchievementsCard from "./AchievementsCard";

// Mapping of muscle groups to icons
const muscleGroupIcons = {
  Abs: <img src={absIcon} alt="Abs" className="muscleGroupIcon" />,
  "Full Body": (
    <img src={ChestIcon} alt="Full Body" className="muscleGroupIcon" />
  ),
  Hip: <img src={HipIcon} alt="Hip" className="muscleGroupIcon" />,
  Triceps: <img src={TricepsIcon} alt="Triceps" className="muscleGroupIcon" />,
  Chest: <img src={ChestIcon} alt="Chest" className="muscleGroupIcon" />,
  Leg: <img src={LegIcon} alt="Leg" className="muscleGroupIcon" />,
  Shoulders: (
    <img src={shouldeIcon} alt="Shoulders" className="muscleGroupIcon" />
  ),
  Cardio: <img src={ChestIcon} alt="Cardio" className="muscleGroupIcon" />,
  Biceps: <img src={bicepsIcon} alt="Biceps" className="muscleGroupIcon" />,
  Forearm: <img src={forearmIcon} alt="Forearm" className="muscleGroupIcon" />,
  "Erector Spinae": (
    <img src={HipIcon} alt="Erector Spinae" className="muscleGroupIcon" />
  ),
  Calisthenic: (
    <img src={backWingsIcon} alt="Calisthenic" className="muscleGroupIcon" />
  ),
  Yoga: <img src={absIcon} alt="Yoga" className="muscleGroupIcon" />,
  Trapezius: (
    <img src={trapeziusIcon} alt="Trapezius" className="muscleGroupIcon" />
  ),
  Neck: <img src={neckIcon} alt="Neck" className="muscleGroupIcon" />,
  Calf: <img src={calfIcon} alt="Calf" className="muscleGroupIcon" />,
  "Back / Wing": (
    <img src={backWingsIcon} alt="Back / Wing" className="muscleGroupIcon" />
  ),
  "Not specified": (
    <img src={backWingsIcon} alt="Not specified" className="muscleGroupIcon" />
  ),
};

// Function to render muscle group with icon
const renderMuscleGroup = (muscle) => (
  <Box
    sx={{
      display: "inline-block",
      alignItems: "center",
      gap: 1,
      width: "auto",
    }}
  >
    {muscleGroupIcons[muscle] || (
      <img src={backWingsIcon} alt="Default" className="muscleGroupIcon" />
    )}
  </Box>
);

const getRecentWorkoutLogs = (logs) => {
  if (!logs || logs.length === 0) return [];
  return logs
    .slice(-3)
    .map((log) => {
      const weight = log[4] === 0 ? "Bodyweight" : log[4];
      return {
        date: log[0],
        muscleGroup: log[1],
        exercise: log[2],
        reps: log[3],
        weight,
        rating: log[5],
      };
    })
    .reverse();
};

const Dashboard = ({ onNavigate, toggleTheme, themeMode }) => {
  const { state, dispatch } = useAppState();
  const { logs, exercises, isAuthenticated, accessToken } = state;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [openModal, setOpenModal] = useState(false);
  const [modalEditLog, setModalEditLog] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layout, setLayout] = useState(
    () =>
      JSON.parse(localStorage.getItem("dashboardLayout")) || {
        showLogs: true,
        showSummary: true,
        showCharts: true,
      }
  );
  const [loading, setLoading] = useState(true);
  const [bodyWeight, setBodyWeight] = useState("");
  const [lastRecordedDate, setLastRecordedDate] = useState(
    localStorage.getItem("lastRecordedDate") || ""
  );
  const [insights, setInsights] = useState([]);
  const [predictedFatigue, setPredictedFatigue] = useState([]);
  const [exerciseInput, setExerciseInput] = useState({ reps: "", weight: "" });
  const [predictedFatigueForInput, setPredictedFatigueForInput] =
    useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [readyToTrain, setReadyToTrain] = useState([]);
  const [restMuscles, setRestMuscles] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useOnlineStatus(setIsOffline);

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
              dispatch({ type: "SET_LOGS", payload: data })
            ),
            syncData(
              "Exercises!A2:D",
              "/api/exercises",
              (data) => dispatch({ type: "SET_EXERCISES", payload: data }),
              (row) => ({
                muscleGroup: row[0],
                exercise: row[1],
                exerciseLink: row[2],
                imageLink: row[3],
              })
            ),
          ]);
          if (Notification.permission === "granted") {
            setTimeout(() => {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification("Workout Reminder", {
                  body: "Time to log your workout!",
                  icon: "/muscles.png",
                });
              });
            }, 3600000);
          }
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      const interval = setInterval(loadData, 300000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken, dispatch]);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US");
    if (today !== lastRecordedDate) {
      if (Notification.permission === "granted") {
        new Notification("Don't forget to record your body weight today!");
      }
    }
  }, [lastRecordedDate]);

  useEffect(() => {
    if (logs) {
      const generatedInsights = generateInsights(logs);
      setInsights(generatedInsights);
    }
  }, [logs]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    dispatch({
      type: "SET_AUTHENTICATION",
      payload: { isAuthenticated: false, accessToken: null },
    });
    onNavigate("login");
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setQuickAddAnchorEl(null);
  };

  const handleQuickAddOpen = (event) =>
    setQuickAddAnchorEl(event.currentTarget);
  const handleQuickAddClose = () => setQuickAddAnchorEl(null);

  const handleMobileMenuOpen = (event) => setMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMenuAnchorEl(null);

  const handleQuickAdd = (recentLog) => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const defaultWeight =
      recentLog.weight === "Bodyweight" ? 0 : recentLog.weight;

    setModalEditLog({
      date,
      muscleGroup: recentLog.muscleGroup,
      exercise: recentLog.exercise,
      reps: "",
      weight: defaultWeight,
      rating: "",
    });
    setOpenModal(true);
    handleMenuClose();
  };

  const handleRecordWeight = async () => {
    const today = new Date().toLocaleDateString("en-US");
    if (today !== lastRecordedDate) {
      try {
        await appendData("Bodyweight!A:B", [[today, bodyWeight]]);
        localStorage.setItem("bodyWeight", bodyWeight);
        localStorage.setItem("lastRecordedDate", today);
        setLastRecordedDate(today);
        showToast("Body weight recorded successfully!", "success");
      } catch (error) {
        console.error("Error recording body weight:", error);
        showToast("Failed to record body weight. Please try again.", "error");
      }
    } else {
      showToast("You have already recorded your weight today.", "info");
    }
  };

  const handleReloadData = async () => {
    setLoading(true);
    try {
      await syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
        dispatch({ type: "SET_LOGS", payload: data })
      );
      showToast("Data reloaded successfully!", "success");
    } catch (error) {
      console.error("Error reloading data:", error);
      showToast("Failed to reload data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReloadLogs = async () => {
    try {
      await syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
        dispatch({ type: "SET_LOGS", payload: data })
      );
      showToast("Workout logs reloaded successfully!", "success");
    } catch (error) {
      console.error("Error reloading workout logs:", error);
      showToast("Failed to reload workout logs. Please try again.", "error");
    }
  };

  const handleReloadCharts = async () => {
    try {
      await syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
        dispatch({ type: "SET_LOGS", payload: data })
      );
      showToast("Charts data reloaded successfully!", "success");
    } catch (error) {
      console.error("Error reloading charts data:", error);
      showToast("Failed to reload charts data. Please try again.", "error");
    }
  };

  const handleReloadSummary = async () => {
    try {
      await syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
        dispatch({ type: "SET_LOGS", payload: data })
      );
      showToast("Workout summary reloaded successfully!", "success");
    } catch (error) {
      console.error("Error reloading workout summary:", error);
      showToast("Failed to reload workout summary. Please try again.", "error");
    }
  };

  const handleReadyToTrainUpdate = (musclesToWorkout, musclesToRest) => {
    setReadyToTrain(musclesToWorkout);
    setRestMuscles(musclesToRest);
  };

  const recentLogs = getRecentWorkoutLogs(logs);

  if (!isAuthenticated) {
    onNavigate("login");
    return null;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box className="sidebar" sx={{ bgcolor: "background.paper" }}>
        <Box
          className="sidebar-item"
          onClick={() => onNavigate("dashboard")}
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <DashboardIcon sx={{ color: "text.primary" }} />
          <span>Dashboard</span>
        </Box>
        <Box
          className="sidebar-item"
          onClick={() => onNavigate("exerciselist")}
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <WorkoutsIcon sx={{ color: "text.primary" }} />
          <span>Workouts</span>
        </Box>
        <Box
          className="sidebar-item"
          onClick={() => onNavigate("bodymeasurements")}
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <BodyMeasurementsIcon sx={{ color: "text.primary" }} />
          <span>Body Measurements</span>
        </Box>
        <Box
          className="sidebar-item"
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <MessagesIcon sx={{ color: "text.primary" }} />
          <span>Messages</span>
        </Box>
        <Box
          className="sidebar-item"
          onClick={() => setSettingsOpen(true)}
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <SettingsIcon sx={{ color: "text.primary" }} />
          <span>Settings</span>
        </Box>
      </Box>

      <Box className="main-container" sx={{ bgcolor: "background.default" }}>
        <Box className="header" sx={{ bgcolor: "background.paper" }}>
          <Typography
            className="header-greeting"
            sx={{ fontSize: "1.5rem", fontWeight: 600, color: "text.primary" }}
          >
            Hi, RV!
          </Typography>
          <TextField
            className="header-search"
            placeholder="Search anything here..."
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, mx: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleReloadData}
            sx={{ mx: 2 }}
          >
            Reload Data
          </Button>
          <Box
            className="header-profile"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Avatar alt="User" src="/path-to-profile-pic.jpg" />
            <Typography sx={{ color: "text.primary" }}>RV</Typography>
            <IconButton onClick={toggleTheme}>
              {themeMode === "light" ? (
                <Brightness4 sx={{ color: "text.primary" }} />
              ) : (
                <Brightness7 sx={{ color: "text.primary" }} />
              )}
            </IconButton>
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ color: "text.primary" }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={0.7}>
            <Box
              className="card"
              sx={{ height: 100, bgcolor: "background.paper" }}
            >
              <Typography
                className="card-subtitle"
                color={isOffline ? "error" : "success"}
                sx={{ mb: 1 }}
              >
                {isOffline ? "Offline" : "Online"}
              </Typography>
              <Badge badgeContent={logs?.length || 0} color="primary">
                <FitnessCenter sx={{ color: "text.primary" }} />
              </Badge>
            </Box>
            <Box className="card" sx={{ bgcolor: "background.paper" }}>
              
              {readyToTrain.length > 0 ? (
                readyToTrain.map((muscle, index) => renderMuscleGroup(muscle))
              ) : (
                <Typography sx={{ color: "text.secondary" }}>
                  No muscle groups are ready to train.
                </Typography>
              )}
            </Box>
            <Box className="card" sx={{ bgcolor: "background.paper" }}>
            
              {restMuscles.length > 0 ? (
                restMuscles.map((muscle, index) => renderMuscleGroup(muscle))
              ) : (
                <Typography sx={{ color: "text.secondary" }}>
                  No muscle groups need rest.
                </Typography>
              )}
            </Box>
          </Grid>

          {layout.showLogs && (
            <Grid item xs={12} md={6}>
              <Box className="card" sx={{ bgcolor: "background.paper" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadLogs} size="small">
                    <RefreshIcon sx={{ color: "text.primary" }} />
                  </IconButton>
                </Box>
                <WorkoutLogsTable
                  logs={logs}
                  isOffline={isOffline}
                  exercises={exercises}
                />
              </Box>
            </Grid>
          )}

          {layout.showCharts && (
            <Grid item xs={12} md={3}>
              <Box
                className="card"
                sx={{ height: 413, bgcolor: "background.paper" }}
              >
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadCharts} size="small">
                    <RefreshIcon sx={{ color: "text.primary" }} />
                  </IconButton>
                </Box>
                <MuscleGroupDistributionChart
                  logs={logs}
                  muscleGroups={exercises.map(
                    (exercise) => exercise.muscleGroup
                  )}
                />
              </Box>
              <Box
                className="card hightLightBox"
                sx={{ marginRight: "5px", bgcolor: "background.paper" }}
              >
                <p
                  className="highLightLBL"
                  style={{
                    fontSize: "40px",
                    marginTop: "-18px",
                    color: "text.primary",
                  }}
                >
                  {logs.length}
                </p>{" "}
                Workouts logged
              </Box>
              <Box
                className="card hightLightBox"
                sx={{ bgcolor: "background.paper" }}
              >
                <p
                  className="highLightLBL"
                  style={{
                    fontSize: "40px",
                    marginTop: "-18px",
                    color: "text.primary",
                  }}
                >
                  {logs.reduce((p, c) => {
                    const reps = parseFloat(c[3]) || 0;
                    const weight = parseFloat(c[4]) || 0;
                    return p + reps * weight;
                  }, 0)}
                </p>{" "}
                Total Volume logged
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={2}>
            <Box
              className="card"
              sx={{ maxHeight: 524, bgcolor: "background.paper" }}
            >
              <TodoList />
            </Box>
          </Grid>

          {layout.showSummary && (
            <Grid item xs={12} md={12}>
              <Box className="card" sx={{ bgcolor: "background.paper" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadSummary} size="small">
                    <RefreshIcon sx={{ color: "text.primary" }} />
                  </IconButton>
                </Box>
                <WorkoutSummaryTable logs={logs} />
              </Box>
            </Grid>
          )}

          {layout.showCharts && (
            <>
              <Grid item xs={12} md={3}>
                <Box
                  className="card"
                  sx={{ height: 400, bgcolor: "background.paper" }}
                >
                  <ProgressionFatigueChart logs={logs} dailyMetrics={logs} />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box
                  className="card"
                  sx={{ height: 400, bgcolor: "background.paper" }}
                >
                  <ProgressionByMuscleChart logs={logs} dailyMetrics={logs} />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box
                  className="card"
                  sx={{ height: 400, bgcolor: "background.paper" }}
                >
                  <VolumeOverTimeChart
                    logs={logs}
                    dates={logs.map((log) => log.date)}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box
                  className="card"
                  sx={{ height: 400, bgcolor: "background.paper" }}
                >
                  <FatigueByMuscleChart
                    logs={logs}
                    muscleGroups={exercises.map(
                      (exercise) => exercise.muscleGroup
                    )}
                    onReadyToTrainUpdate={(musclesToWorkout, musclesToRest) =>
                      handleReadyToTrainUpdate(musclesToWorkout, musclesToRest)
                    }
                  />
                </Box>
              </Grid>
            </>
          )}

          <Grid item xs={12} md={6}>
            <Box className="card" sx={{ bgcolor: "background.paper" }}>
              <Typography className="card-title" sx={{ color: "text.primary" }}>
                Progress Goals
              </Typography>
              <ProgressGoals logs={logs} />
            </Box>
            <Box className="card" sx={{ bgcolor: "background.paper" }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  label="Body Weight (kg)"
                  type="number"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                />
                <Button variant="contained" onClick={handleRecordWeight}>
                  Record
                </Button>
              </Box>
              <Typography
                variant="body2"
                sx={{ mt: 2, color: "text.secondary" }}
              >
                Last recorded: {lastRecordedDate || "Not recorded yet"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}></Grid>

          <Grid item xs={12} md={6}></Grid>

          <Grid item xs={12} md={6}>
            <AchievementsCard logs={logs} />
          </Grid>
        </Grid>

        <Fab
          color="primary"
          onClick={handleMenuOpen}
          aria-label="add"
          className="fab-add"
          sx={{ "&:hover": { transform: "scale(1.1)" } }}
        >
          <Add />
        </Fab>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          PaperProps={{ sx: { bgcolor: "background.paper" } }}
        >
          <MenuItem
            onClick={() => {
              setModalEditLog(null);
              setOpenModal(true);
              handleMenuClose();
            }}
            sx={{ color: "text.primary" }}
          >
            New Workout
          </MenuItem>
          <MenuItem onClick={handleQuickAddOpen} sx={{ color: "text.primary" }}>
            Quick Add
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={quickAddAnchorEl}
          open={Boolean(quickAddAnchorEl)}
          onClose={handleQuickAddClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { bgcolor: "background.paper" } }}
        >
          {recentLogs.length > 0 ? (
            recentLogs.map((log, index) => (
              <MenuItem
                key={index}
                onClick={() => handleQuickAdd(log)}
                sx={{ color: "text.primary" }}
              >
                {log.exercise} ({log.muscleGroup}) - {log.date}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled sx={{ color: "text.secondary" }}>
              No recent workouts
            </MenuItem>
          )}
        </Menu>

        <WorkoutLogModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setModalEditLog(null);
          }}
          exercises={exercises}
          isOffline={isOffline}
          editLog={modalEditLog}
        />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdateLayout={setLayout}
        />
      </Box>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        severity={toast.severity}
      />
    </>
  );
};

export default Dashboard;
