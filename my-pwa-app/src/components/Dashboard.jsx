import React, { useState, useEffect } from "react";
import {
  Box,
  Snackbar,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  initClient,
  syncData,
  useOnlineStatus,
  appendData,
} from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import SettingsModal from "./SettingsModal";

// Import dashboard components using the index file
import {
  DashboardHeader,
  DashboardSidebar,
  DashboardGrid,
  DashboardWidgets,
  DashboardFab,
  defaultLayouts,
  getRecentWorkoutLogs
} from "./Dashboard/index";

// Import dashboard styles
import "../styles/dashboard.css";

// Import hook for global state
import { useAppState } from "../index";

const Dashboard = ({ onNavigate, toggleTheme, themeMode }) => {
  const { state, dispatch } = useAppState();
  const { logs, exercises, isAuthenticated, accessToken } = state;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [openModal, setOpenModal] = useState(false);
  const [modalEditLog, setModalEditLog] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [layout, setLayout] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("dashboardLayout")) || {};
    return {
      visibility: {
        status: true,
        train: true,
        rest: true,
        "workout-features": true,
        "workout-logs": true,
        "muscle-distribution": true,
        "workout-count": true,
        "total-volume": true,
        "todo-list": true,
        "workout-summary": true,
        "progression-fatigue": true,
        "progression-muscle": true,
        "volume-over-time": true,
        "fatigue-by-muscle": true,
        "progress-goals": true,
        "body-weight": true,
        achievements: true,
        "weekly-summary": true,
        "monthly-summary": true,
        "streak-tracker": true,
        ...saved.visibility,
      },
      layouts: saved.layouts || defaultLayouts,
    };
  });
  const [loading, setLoading] = useState(true);
  const [bodyWeight, setBodyWeight] = useState("");
  const [lastRecordedDate, setLastRecordedDate] = useState(
    localStorage.getItem("lastRecordedDate") || ""
  );
  const [readyToTrain, setReadyToTrain] = useState([]);
  const [restMuscles, setRestMuscles] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const theme = useTheme();

  useOnlineStatus(setIsOffline);

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate("login");
    }
  }, [isAuthenticated, onNavigate]);

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
                registration.showNotification("Workout reminder", {
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
    if (!isCustomizing) {
      localStorage.setItem("dashboardLayout", JSON.stringify(layout));
    }
  }, [layout, isCustomizing]);

  useEffect(() => {
    if (logs && logs.length > 0 && exercises && exercises.length > 0) {
      // Get today's date and create a date object for comparison
      const today = new Date();
      
      // Track the last workout date for each muscle group
      const muscleGroupLastWorkout = {};
      const allMuscleGroups = [...new Set(exercises.map(ex => ex.muscleGroup))];
      
      // Analyze logs to find the last workout date for each muscle group
      logs.forEach(log => {
        const logDate = new Date(log[0]);
        const muscleGroup = log[1];
        
        if (!muscleGroupLastWorkout[muscleGroup] || 
            new Date(muscleGroupLastWorkout[muscleGroup]) < logDate) {
          muscleGroupLastWorkout[muscleGroup] = logDate;
        }
      });
      
      // Determine which muscle groups are ready to train and which need rest
      const readyMuscleGroups = [];
      const restingMuscleGroups = [];
      
      allMuscleGroups.forEach(muscleGroup => {
        const lastWorkout = muscleGroupLastWorkout[muscleGroup];
        
        if (!lastWorkout) {
          // If never worked out, it's ready to train
          readyMuscleGroups.push(muscleGroup);
        } else {
          // Calculate days since last workout
          const daysSinceLastWorkout = Math.floor(
            (today - new Date(lastWorkout)) / (1000 * 60 * 60 * 24)
          );
          
          // If it's been at least 3 days since last workout, ready to train
          // Otherwise needs rest
          if (daysSinceLastWorkout >= 3) {
            readyMuscleGroups.push(muscleGroup);
          } else {
            restingMuscleGroups.push(muscleGroup);
          }
        }
      });
      
      // Ensure no muscle appears in both lists
      // If a muscle is in readyToTrain, it shouldn't be in restMuscles
      const uniqueRestMuscles = restingMuscleGroups.filter(
        muscle => !readyMuscleGroups.includes(muscle)
      );
      
      setReadyToTrain(readyMuscleGroups);
      setRestMuscles(uniqueRestMuscles);
    }
  }, [logs, exercises]);

  const handleLogout = () => {
    // Call the centralized auth logout function first
    import("../services/authService").then(({ logout }) => {
      logout(); // This properly clears all tokens and updates auth state
      
      // Then update the app state
      dispatch({
        type: "SET_AUTHENTICATION",
        payload: { isAuthenticated: false, accessToken: null },
      });
      
      // Navigate to login page
      onNavigate("login");
    }).catch(error => {
      console.error("Error during logout:", error);
      // Fallback logout - direct localStorage removal
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("expires_at");
      localStorage.removeItem("id_token");
      localStorage.removeItem("auth_state");
      
      dispatch({
        type: "SET_AUTHENTICATION",
        payload: { isAuthenticated: false, accessToken: null },
      });
      onNavigate("login");
    });
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setQuickAddAnchorEl(null);
  };

  const handleQuickAddOpen = (event) =>
    setQuickAddAnchorEl(event.currentTarget);
  const handleQuickAddClose = () => setQuickAddAnchorEl(null);

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

  const handleLayoutChange = (currentLayout, allLayouts) => {
    if (isCustomizing) {
      setLayout((prev) => ({
        ...prev,
        layouts: allLayouts,
      }));
    }
  };

  const handleResetLayout = () => {
    setLayout({
      visibility: layout.visibility,
      layouts: defaultLayouts,
    });
    showToast("Layout reset successfully!", "success");
  };

  const toggleCustomizeMode = () => {
    setIsCustomizing((prev) => {
      if (prev) {
        localStorage.setItem("dashboardLayout", JSON.stringify(layout));
        showToast("Dashboard layout and visibility saved!", "success");
      } else {
        showToast(
          "Customize mode enabled. Drag, resize, or edit visibility in Settings.",
          "info"
        );
      }
      return !prev;
    });
  };

  const recentLogs = getRecentWorkoutLogs(logs || []);

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
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <DashboardSidebar onNavigate={onNavigate} />

      <Box className="main-container" sx={{ bgcolor: "background.default" }}>
        <DashboardHeader 
          toggleTheme={toggleTheme} 
          themeMode={themeMode} 
          handleReloadData={handleReloadData}
          isCustomizing={isCustomizing}
          toggleCustomizeMode={toggleCustomizeMode}
          handleLogout={handleLogout}
          handleSettingsOpen={setSettingsOpen}
        />

        <DashboardGrid
          layouts={layout.layouts}
          isCustomizing={isCustomizing}
          visibility={layout.visibility}
          handleLayoutChange={handleLayoutChange}
        >
          {DashboardWidgets({
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
          })}
        </DashboardGrid>

        <DashboardFab 
          handleMenuOpen={handleMenuOpen}
          anchorEl={anchorEl}
          handleMenuClose={handleMenuClose}
          setModalEditLog={setModalEditLog}
          setOpenModal={setOpenModal}
          handleQuickAddOpen={handleQuickAddOpen}
          quickAddAnchorEl={quickAddAnchorEl}
          handleQuickAddClose={handleQuickAddClose}
          recentLogs={recentLogs}
          handleQuickAdd={handleQuickAdd}
        />

        <WorkoutLogModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setModalEditLog(null);
          }}
          exercises={exercises}
          isOffline={isOffline}
          editLog={modalEditLog}
          onSave={async (row, originalIndex) => {
            try {
              // Handle successful save
              showToast("Workout logged successfully!", "success");
              
              // Reload the workout logs to show the latest data
              try {
                await syncData("Workout_Logs!A2:G", "/api/workout", (data) =>
                  dispatch({ type: "SET_LOGS", payload: data })
                );
              } catch (reloadError) {
                console.error("Error reloading workout logs:", reloadError);
                // Non-critical error, don't show toast for this
              }
              
              // Close the modal
              setOpenModal(false);
              setModalEditLog(null);
              
              return true; // Return success to the modal
            } catch (error) {
              console.error("Error in WorkoutLogModal onSave callback:", error);
              showToast("Failed to process workout log", "error");
              return true; // Still return true to let the modal handle its own state
            }
          }}
        />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdateLayout={setLayout}
          onResetLayout={handleResetLayout}
          layout={layout}
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
