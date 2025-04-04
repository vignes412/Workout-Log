import React, { useState, useEffect } from "react";
import {
  initClient,
  syncData,
  useOnlineStatus,
  appendData,
} from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import SettingsModal from "./SettingsModal";
import ProgressGoals from "./ProgressGoals";
import ProgressionFatigueChart from "./charts/ProgressionFatigueChart"; // Updated path
import ProgressionByMuscleChart from "./charts/ProgressionByMuscleChart";
import VolumeOverTimeChart from "./charts/VolumeOverTimeChart";
import MuscleGroupDistributionChart from "./charts/MuscleGroupDistributionChart";
import FatigueByMuscleChart from "./charts/FatigueByMuscleChart";
import TodoList from "./TodoList";
import {
  Button,
  Typography,
  Fab,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Container,
  Paper,
  LinearProgress,
  Badge,
  useMediaQuery,
  useTheme,
  TextField,
  Alert,
  Grid,
  Avatar,
  Snackbar,
} from "@mui/material";
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
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorWeightIcon from "@mui/icons-material/MonitorWeight";
import WorkoutLogsTable from "./WorkoutLogsTable";
import WorkoutSummaryTable from "./WorkoutSummaryTable";
import Charts from "./Charts";
import { useAppState } from "../index";
import "../styles.css";
import { generateInsights } from "../utils/aiInsights";

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
        }}
      >
        <LinearProgress sx={{ width: "50%" }} />
      </Box>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <Box className="sidebar">
        <Box className="sidebar-item" onClick={() => onNavigate("dashboard")}>
          <DashboardIcon />
          <span>Dashboard</span>
        </Box>
        <Box
          className="sidebar-item"
          onClick={() => onNavigate("exerciselist")}
        >
          <WorkoutsIcon />
          <span>Workouts</span>
        </Box>
        <Box
          className="sidebar-item"
          onClick={() => onNavigate("bodymeasurements")}
        >
          <BodyMeasurementsIcon />
          <span>Body Measurements</span>
        </Box>
        <Box className="sidebar-item">
          <MessagesIcon />
          <span>Messages</span>
        </Box>
        <Box className="sidebar-item" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
          <span>Settings</span>
        </Box>
      </Box>

      {/* Main Content */}
      <Box className="main-container">
        {/* Header */}
        <Box className="header">
          <Typography className="header-greeting">Hi, User!</Typography>
          <TextField
            className="header-search"
            placeholder="Search anything here..."
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleReloadData}
            sx={{ marginLeft: 2 }}
          >
            Reload Data
          </Button>
          <Box className="header-profile">
            <Avatar alt="User" src="/path-to-profile-pic.jpg" />
            <Typography>User Name</Typography>
            <IconButton onClick={toggleTheme}>
              {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>

        {/* Main Grid */}
        <Grid container spacing={3}>
          {/* Status Card */}
          <Grid item xs={12} sm={6} md={0.7}>
            <Box className="card" sx={{ height: 100 }}>
              <Typography
                className="card-subtitle"
                color={isOffline ? "error" : "success"}
                sx={{ mb: 1 }}
              >
                {isOffline ? "Offline" : "Online"}
              </Typography>
              <Badge badgeContent={logs?.length || 0} color="primary">
                <FitnessCenter />
              </Badge>
            </Box>
          </Grid>

          {/* Workout Logs */}
          {layout.showLogs && (
            <Grid item xs={12} md={6}>
              <Box className="card">
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadLogs} size="small">
                    <RefreshIcon />
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
              <Box className="card" sx={{ height: 413 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadCharts} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <MuscleGroupDistributionChart
                  logs={logs}
                  muscleGroups={exercises.map(
                    (exercise) => exercise.muscleGroup
                  )}
                />
              </Box>
              <Box className="card hightLightBox" sx={{ marginRight: "6px" }}>
                <p className="highLightLBL">{logs.length}</p> Workouts logged
              </Box>
              <Box className="card hightLightBox">
                <p className="highLightLBL">
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
          {/* Add TodoList Component */}
          <Grid item xs={12} md={2}>
            <Box className="card" sx={{ maxHeight: 524 }}>
              <TodoList />
            </Box>
          </Grid>
          {/* Workout Summary */}
          {layout.showSummary && (
            <Grid item xs={12} md={12}>
              <Box className="card">
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={handleReloadSummary} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <WorkoutSummaryTable logs={logs} />
              </Box>
            </Grid>
          )}

          {/* Charts */}
          {layout.showCharts && (
            <>
              <Grid item xs={12} md={6}>
                <Box className="card" sx={{ height: 400 }}>
                  <Typography className="card-title">
                    Progression Fatigue Chart
                  </Typography>
                  <ProgressionFatigueChart logs={logs} dailyMetrics={logs} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box className="card" sx={{ height: 400 }}>
                  <ProgressionByMuscleChart logs={logs} dailyMetrics={logs} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box className="card" sx={{ height: 400 }}>
                  <VolumeOverTimeChart
                    logs={logs}
                    dates={logs.map((log) => log.date)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box className="card" sx={{ height: 400 }}>
                  <FatigueByMuscleChart
                    logs={logs}
                    muscleGroups={exercises.map(
                      (exercise) => exercise.muscleGroup
                    )}
                  />
                </Box>
              </Grid>
            </>
          )}

          {/* Progress Goals */}
          <Grid item xs={12} md={6}>
            <Box className="card">
              <Typography className="card-title">Progress Goals</Typography>
              <ProgressGoals logs={logs} />
            </Box>
          </Grid>
        </Grid>
        {/* Record Body Weight */}
        <Grid item xs={12} md={6}>
          <Box className="card">
            <Typography className="card-title">Record Body Weight</Typography>
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
            <Typography variant="body2" sx={{ mt: 2 }}>
              Last recorded: {lastRecordedDate || "Not recorded yet"}
            </Typography>
          </Box>
        </Grid>

        {/* AI Insights (Commented Out) */}
        {/* {insights.length > 0 && (
            <Grid item xs={12}>
              <Box className="card">
                <Typography className="card-title">AI Insights</Typography>
                {insights.map((insight, index) => (
                  <Alert
                    key={index}
                    severity={insight.type === "warning" ? "warning" : "success"}
                    sx={{ mb: 2 }}
                  >
                    {insight.message}
                  </Alert>
                ))}
              </Box>
            </Grid>
          )} */}

        {/* Predicted Fatigue */}
        {predictedFatigue.length > 0 && (
          <Grid item xs={12}>
            <Box className="card">
              <Typography className="card-title">
                Predicted Fatigue Levels
              </Typography>
              {predictedFatigue.map((fatigue, index) => (
                <Alert key={index} severity="info" sx={{ mb: 2 }}>
                  Workout {index + 1}: Predicted Fatigue Level -{" "}
                  {typeof fatigue === "number" ? fatigue.toFixed(2) : "N/A"}
                </Alert>
              ))}
            </Box>
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={handleMenuOpen}
          aria-label="add"
          className="fab-add"
        >
          <Add />
        </Fab>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <MenuItem
            onClick={() => {
              setModalEditLog(null);
              setOpenModal(true);
              handleMenuClose();
            }}
          >
            New Workout
          </MenuItem>
          <MenuItem onClick={handleQuickAddOpen}>Quick Add</MenuItem>
        </Menu>

        <Menu
          anchorEl={quickAddAnchorEl}
          open={Boolean(quickAddAnchorEl)}
          onClose={handleQuickAddClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {recentLogs.length > 0 ? (
            recentLogs.map((log, index) => (
              <MenuItem key={index} onClick={() => handleQuickAdd(log)}>
                {log.exercise} ({log.muscleGroup}) - {log.date}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No recent workouts</MenuItem>
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
