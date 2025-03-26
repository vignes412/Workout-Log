import React, { useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";
import {
  initClient,
  syncData,
  appendData,
  useOnlineStatus,
} from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import {
  Button,
  Typography,
  Fab,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { Add, Brightness4, Brightness7 } from "@mui/icons-material";
import WorkoutLogsTable from "./WorkoutLogsTable";
import WorkoutSummaryTable from "./WorkoutSummaryTable";
import Charts from "./Charts";
import "../styles.css";

// Helper function to get the last 3 recent workout logs
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [logs, setLogs] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalEditLog, setModalEditLog] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);

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
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken, isOffline]);

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

  const handleQuickAdd = async (recentLog) => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const newLogObject = {
      date,
      muscleGroup: recentLog.muscleGroup,
      exercise: recentLog.exercise,
      reps: "",
      weight: "",
      rating: "",
    };

    try {
      setModalEditLog(newLogObject);
      setOpenModal(true);
    } catch (error) {
      console.error("Error in quick add:", error);
    } finally {
      handleMenuClose();
    }
  };

  const recentLogs = getRecentWorkoutLogs(logs);

  if (!isAuthenticated) {
    onNavigate("login");
    return null;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={() => onNavigate("exerciselist")}>
            Exercise List
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <div className="dashboard-content">
        <Typography variant="body1" sx={{ mb: 2 }}>
          Status: {isOffline ? "Offline" : "Online"}
        </Typography>
        <WorkoutLogsTable
          logs={logs}
          setLogs={setLogs}
          isOffline={isOffline}
          exercises={exercises}
        />
        <WorkoutSummaryTable logs={logs} />
        <Charts logs={logs} themeMode={themeMode} /> {/* Pass themeMode */}
      </div>

      <Fab
        color="primary"
        onClick={handleMenuOpen}
        className="fab-add"
        aria-label="add"
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
          Workout Log
        </MenuItem>
        <MenuItem onClick={handleQuickAddOpen}>Quick Add</MenuItem>
        <MenuItem onClick={handleMenuClose}>Body Weight</MenuItem>
        <MenuItem onClick={handleMenuClose}>Exercise</MenuItem>
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
          <MenuItem disabled>No recent workouts yet</MenuItem>
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
    </div>
  );
};

export default Dashboard;
