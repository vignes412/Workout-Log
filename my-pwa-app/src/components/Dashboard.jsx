import React, { useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";
import {
  initClient,
  syncData,
  useOnlineStatus,
  appendData,
} from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import SettingsModal from "./SettingsModal";
import ProgressGoals from "./ProgressGoals";
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
} from "@mui/material";
import {
  Add,
  Brightness4,
  Brightness7,
  FitnessCenter,
  Settings,
  Menu as MenuIcon,
} from "@mui/icons-material";
import WorkoutLogsTable from "./WorkoutLogsTable";
import WorkoutSummaryTable from "./WorkoutSummaryTable";
import Charts from "./Charts";
import { useAppState } from "../index";
import "../styles.css";

const getRecentWorkoutLogs = (logs) => {
  if (!logs || logs.length === 0) return [];
  return logs
    .slice(-3)
    .map((log) => ({
      date: log[0],
      muscleGroup: log[1],
      exercise: log[2],
      reps: log[3],
      weight: log[4],
      rating: log[5],
    }))
    .reverse();
};

const Dashboard = ({
  isAuthenticated,
  setIsAuthenticated,
  accessToken,
  onNavigate,
  toggleTheme,
  themeMode,
}) => {
  const { logs, setLogs, exercises, setExercises } = useAppState();
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Mobile <= 600px

  useOnlineStatus(setIsOffline);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", setLogs),
            syncData(
              "Exercises!A2:D",
              "/api/exercises",
              setExercises,
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
            }, 3600000); // 1 hour
          }
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      const interval = setInterval(loadData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken, setLogs, setExercises]);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US");
    if (today !== lastRecordedDate) {
      // Trigger notification for recording body weight
      if (Notification.permission === "granted") {
        new Notification("Don't forget to record your body weight today!");
      }
    }
  }, [lastRecordedDate]);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
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
    setModalEditLog({
      date,
      muscleGroup: recentLog.muscleGroup,
      exercise: recentLog.exercise,
      reps: "",
      weight: "",
      rating: "",
    });
    setOpenModal(true);
    handleMenuClose();
  };

  const handleRecordWeight = async () => {
    const today = new Date().toLocaleDateString("en-US");
    if (today !== lastRecordedDate) {
      try {
        // Pass a single row as a two-dimensional array
        await appendData("Bodyweight!A:B", [[today, bodyWeight]]);
        localStorage.setItem("bodyWeight", bodyWeight);
        localStorage.setItem("lastRecordedDate", today);
        setLastRecordedDate(today);
        alert("Body weight recorded successfully!");
      } catch (error) {
        console.error("Error recording body weight:", error);
        alert("Failed to record body weight. Please try again.");
      }
    } else {
      alert("You have already recorded your weight today.");
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
    <Container maxWidth="lg" className="dashboard-container">
      <AppBar
        position="static"
        elevation={0}
        sx={{ borderRadius: "10px 10px 0 0" }}
      >
        <Toolbar sx={{ flexWrap: "wrap", justifyContent: "space-between" }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", mr: 2, flexShrink: 0 }}
          >
            Fitness Dashboard
          </Typography>
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleMobileMenuOpen}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMobileMenuClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem
                  onClick={() => {
                    onNavigate("exerciselist");
                    handleMobileMenuClose();
                  }}
                >
                  Exercises
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onNavigate("workoutplanner");
                    handleMobileMenuClose();
                  }}
                >
                  Planner
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onNavigate("bodymeasurements");
                    handleMobileMenuClose();
                  }}
                >
                  Body Measurements
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleMobileMenuClose();
                  }}
                >
                  Logout
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    toggleTheme();
                    handleMobileMenuClose();
                  }}
                >
                  Toggle {themeMode === "light" ? "Dark" : "Light"} Theme
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setSettingsOpen(true);
                    handleMobileMenuClose();
                  }}
                >
                  Settings
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                color="inherit"
                onClick={() => onNavigate("exerciselist")}
              >
                Exercises
              </Button>
              <Button
                color="inherit"
                onClick={() => onNavigate("workoutplanner")}
              >
                Planner
              </Button>
              <Button
                color="inherit"
                onClick={() => onNavigate("bodymeasurements")}
              >
                Body Measurements
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
              <IconButton color="inherit" onClick={toggleTheme}>
                {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
              </IconButton>
              <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
                <Settings />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Paper elevation={3} sx={{ p: 3, mt: 2, borderRadius: "0 0 10px 10px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" color={isOffline ? "error" : "success"}>
            Status: {isOffline ? "Offline" : "Online"}
          </Typography>
          <Badge badgeContent={logs?.length || 0} color="primary">
            <FitnessCenter />
          </Badge>
        </Box>

        {layout.showLogs && (
          <WorkoutLogsTable
            logs={logs}
            setLogs={setLogs}
            isOffline={isOffline}
            exercises={exercises}
          />
        )}
        {layout.showSummary && <WorkoutSummaryTable logs={logs} />}
        {layout.showCharts && <Charts logs={logs} themeMode={themeMode} />}
        <ProgressGoals logs={logs} />
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          Record Body Weight
        </Typography>
        <Paper elevation={3} sx={{ p: 3, borderRadius: "10px" }}>
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
        </Paper>
      </Box>

      <Fab
        color="primary"
        onClick={handleMenuOpen}
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          boxShadow: 6,
        }}
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
    </Container>
  );
};

export default Dashboard;
