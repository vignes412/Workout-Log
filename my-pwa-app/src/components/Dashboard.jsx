// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { initClient, syncData, useOnlineStatus } from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import {
  Button,
  Typography,
  Fab,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import WorkoutLogsTable from "./WorkoutLogsTable";
import WorkoutSummaryTable from "./WorkoutSummaryTable";
import Charts from "./Charts";
import "../styles.css";

const Dashboard = ({ isAuthenticated, setIsAuthenticated, accessToken }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [logs, setLogs] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useOnlineStatus(setIsOffline);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", setLogs),
            syncData(
              "Exercises!A2:B",
              "/api/exercises",
              setExercises,
              (row) => ({
                muscleGroup: row[0],
                exercise: row[1],
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
    navigate("/");
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  if (!isAuthenticated) {
    navigate("/");
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
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <div className="dashboard-content">
        <Typography variant="body1" sx={{ mb: 2 }}>
          Status: {isOffline ? "Offline" : "Online"}
        </Typography>

        {/* Workout Logs Table (Top) */}
        <WorkoutLogsTable
          logs={logs}
          setLogs={setLogs}
          isOffline={isOffline}
          exercises={exercises}
        />

        {/* Workout Summary Table (Bottom) */}
        <WorkoutSummaryTable logs={logs} />

        <Charts logs={logs} />
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
            setOpenModal(true);
            handleMenuClose();
          }}
        >
          Workout Log
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Body Weight</MenuItem>
        <MenuItem onClick={handleMenuClose}>Exercise</MenuItem>
      </Menu>

      <WorkoutLogModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        exercises={exercises}
        isOffline={isOffline}
      />
    </div>
  );
};

export default Dashboard;
