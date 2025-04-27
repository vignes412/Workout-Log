import React, { useState, useEffect } from "react";
import {
  useTheme,
  Box,
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
  Edit as EditIcon,
  Save as SaveIcon,
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
import { refreshTokenPeriodically } from "../serviceWorkerRegistration";
import WeeklySummaryCard from "./WeeklySummaryCard";
import MonthlySummaryCard from "./MonthlySummaryCard";
import StreakTracker from "./StreakTracker";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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

const renderMuscleGroup = (muscle) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
    }}
    className="muscle-icon"
  >
    {muscleGroupIcons[muscle] || <></>}
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

const defaultLayouts = {
  lg: [
    {
      i: "status",
      x: 0,
      y: 0,
      w: 2,
      h: 5,
      minW: 1,
      maxW: 6,
      minH: 3,
      maxH: 10,
    },
    { i: "train", x: 0, y: 5, w: 2, h: 7, minW: 1, maxW: 6, minH: 3, maxH: 12 },
    { i: "rest", x: 0, y: 12, w: 2, h: 7, minW: 1, maxW: 6, minH: 3, maxH: 12 },
    {
      i: "workout-logs",
      x: 2,
      y: 0,
      w: 6,
      h: 18,
      minW: 3,
      maxW: 8,
      minH: 8,
      maxH: 24,
    },
    {
      i: "muscle-distribution",
      x: 8,
      y: 0,
      w: 4,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "workout-count",
      x: 8,
      y: 15,
      w: 2,
      h: 5,
      minW: 1,
      maxW: 4,
      minH: 3,
      maxH: 8,
    },
    {
      i: "total-volume",
      x: 10,
      y: 15,
      w: 2,
      h: 5,
      minW: 1,
      maxW: 4,
      minH: 3,
      maxH: 8,
    },
    {
      i: "todo-list",
      x: 8,
      y: 20,
      w: 4,
      h: 18,
      minW: 2,
      maxW: 6,
      minH: 8,
      maxH: 24,
    },
    {
      i: "workout-summary",
      x: 0,
      y: 19,
      w: 12,
      h: 18,
      minW: 4,
      maxW: 12,
      minH: 8,
      maxH: 24,
    },
    {
      i: "progression-fatigue",
      x: 0,
      y: 37,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progression-muscle",
      x: 3,
      y: 37,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "volume-over-time",
      x: 6,
      y: 37,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "fatigue-by-muscle",
      x: 9,
      y: 37,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progress-goals",
      x: 0,
      y: 52,
      w: 6,
      h: 12,
      minW: 3,
      maxW: 8,
      minH: 6,
      maxH: 16,
    },
    {
      i: "body-weight",
      x: 0,
      y: 64,
      w: 6,
      h: 10,
      minW: 3,
      maxW: 8,
      minH: 4,
      maxH: 14,
    },
    {
      i: "achievements",
      x: 6,
      y: 52,
      w: 6,
      h: 14,
      minW: 3,
      maxW: 8,
      minH: 6,
      maxH: 18,
    },
    {
      i: "weekly-summary",
      x: 0,
      y: 74,
      w: 6,
      h: 14,
      minW: 3,
      maxW: 8,
      minH: 6,
      maxH: 18,
    },
    {
      i: "monthly-summary",
      x: 6,
      y: 74,
      w: 6,
      h: 14,
      minW: 3,
      maxW: 8,
      minH: 6,
      maxH: 18,
    },
    {
      i: "streak-tracker",
      x: 0,
      y: 88,
      w: 6,
      h: 14,
      minW: 3,
      maxW: 8,
      minH: 6,
      maxH: 18,
    },
  ],
  md: [
    {
      i: "status",
      x: 0,
      y: 0,
      w: 3,
      h: 5,
      minW: 1,
      maxW: 6,
      minH: 3,
      maxH: 10,
    },
    { i: "train", x: 0, y: 5, w: 3, h: 7, minW: 1, maxW: 6, minH: 3, maxH: 12 },
    { i: "rest", x: 0, y: 12, w: 3, h: 7, minW: 1, maxW: 6, minH: 3, maxH: 12 },
    {
      i: "workout-logs",
      x: 3,
      y: 0,
      w: 6,
      h: 18,
      minW: 3,
      maxW: 9,
      minH: 8,
      maxH: 24,
    },
    {
      i: "muscle-distribution",
      x: 0,
      y: 18,
      w: 4,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "workout-count",
      x: 4,
      y: 18,
      w: 2,
      h: 5,
      minW: 1,
      maxW: 4,
      minH: 3,
      maxH: 8,
    },
    {
      i: "total-volume",
      x: 6,
      y: 18,
      w: 2,
      h: 5,
      minW: 1,
      maxW: 4,
      minH: 3,
      maxH: 8,
    },
    {
      i: "todo-list",
      x: 0,
      y: 33,
      w: 4,
      h: 18,
      minW: 2,
      maxW: 6,
      minH: 8,
      maxH: 24,
    },
    {
      i: "workout-summary",
      x: 0,
      y: 51,
      w: 9,
      h: 18,
      minW: 4,
      maxW: 9,
      minH: 8,
      maxH: 24,
    },
    {
      i: "progression-fatigue",
      x: 0,
      y: 69,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progression-muscle",
      x: 3,
      y: 69,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "volume-over-time",
      x: 6,
      y: 69,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "fatigue-by-muscle",
      x: 0,
      y: 84,
      w: 3,
      h: 15,
      minW: 2,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progress-goals",
      x: 0,
      y: 99,
      w: 4,
      h: 12,
      minW: 3,
      maxW: 6,
      minH: 6,
      maxH: 16,
    },
    {
      i: "body-weight",
      x: 4,
      y: 99,
      w: 4,
      h: 10,
      minW: 3,
      maxW: 6,
      minH: 4,
      maxH: 14,
    },
    {
      i: "achievements",
      x: 0,
      y: 109,
      w: 4,
      h: 14,
      minW: 3,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "weekly-summary",
      x: 0,
      y: 123,
      w: 4,
      h: 14,
      minW: 3,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "monthly-summary",
      x: 4,
      y: 123,
      w: 4,
      h: 14,
      minW: 3,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "streak-tracker",
      x: 0,
      y: 137,
      w: 4,
      h: 14,
      minW: 3,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
  ],
  sm: [
    {
      i: "status",
      x: 0,
      y: 0,
      w: 6,
      h: 5,
      minW: 3,
      maxW: 6,
      minH: 3,
      maxH: 10,
    },
    { i: "train", x: 0, y: 5, w: 6, h: 7, minW: 3, maxW: 6, minH: 3, maxH: 12 },
    { i: "rest", x: 0, y: 12, w: 6, h: 7, minW: 3, maxW: 6, minH: 3, maxH: 12 },
    {
      i: "workout-logs",
      x: 0,
      y: 19,
      w: 6,
      h: 18,
      minW: 4,
      maxW: 6,
      minH: 8,
      maxH: 24,
    },
    {
      i: "muscle-distribution",
      x: 0,
      y: 37,
      w: 6,
      h: 15,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "workout-count",
      x: 0,
      y: 52,
      w: 3,
      h: 5,
      minW: 3,
      maxW: 6,
      minH: 3,
      maxH: 8,
    },
    {
      i: "total-volume",
      x: 3,
      y: 52,
      w: 3,
      h: 5,
      minW: 3,
      maxW: 6,
      minH: 3,
      maxH: 8,
    },
    {
      i: "todo-list",
      x: 0,
      y: 57,
      w: 6,
      h: 18,
      minW: 4,
      maxW: 6,
      minH: 8,
      maxH: 24,
    },
    {
      i: "workout-summary",
      x: 0,
      y: 75,
      w: 6,
      h: 18,
      minW: 4,
      maxW: 6,
      minH: 8,
      maxH: 24,
    },
    {
      i: "progression-fatigue",
      x: 0,
      y: 93,
      w: 6,
      h: 15,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progression-muscle",
      x: 0,
      y: 108,
      w: 6,
      h: 15,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "volume-over-time",
      x: 0,
      y: 123,
      w: 6,
      h: 15,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "fatigue-by-muscle",
      x: 0,
      y: 138,
      w: 6,
      h: 15,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 20,
    },
    {
      i: "progress-goals",
      x: 0,
      y: 153,
      w: 6,
      h: 12,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 16,
    },
    {
      i: "body-weight",
      x: 0,
      y: 165,
      w: 6,
      h: 10,
      minW: 4,
      maxW: 6,
      minH: 4,
      maxH: 14,
    },
    {
      i: "achievements",
      x: 0,
      y: 175,
      w: 6,
      h: 14,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "weekly-summary",
      x: 0,
      y: 189,
      w: 6,
      h: 14,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "monthly-summary",
      x: 0,
      y: 203,
      w: 6,
      h: 14,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
    {
      i: "streak-tracker",
      x: 0,
      y: 217,
      w: 6,
      h: 14,
      minW: 4,
      maxW: 6,
      minH: 6,
      maxH: 18,
    },
  ],
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
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [layout, setLayout] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("dashboardLayout")) || {};
    return {
      visibility: {
        showLogs: true,
        showSummary: true,
        showCharts: true,
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
  const [searchQuery, setSearchQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        showToast("Dashboard layout saved!", "success");
      } else {
        showToast("Customize mode enabled. Drag and resize cards.", "info");
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
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReloadData}
              sx={{ mx: 1 }}
            >
              Reload Data
            </Button>
            <Button
              variant={isCustomizing ? "contained" : "outlined"}
              color={isCustomizing ? "secondary" : "primary"}
              onClick={toggleCustomizeMode}
              startIcon={isCustomizing ? <SaveIcon /> : <EditIcon />}
              sx={{ mx: 1 }}
            >
              {isCustomizing ? "Save Layout" : "Customize Dashboard"}
            </Button>
          </Box>
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

        <ResponsiveGridLayout
          className="layout"
          layouts={layout.layouts}
          breakpoints={{ lg: 1200, md: 960, sm: 600 }}
          cols={{ lg: 12, md: 9, sm: 6 }}
          rowHeight={20}
          width={1200}
          onLayoutChange={handleLayoutChange}
          isResizable={isCustomizing}
          isDraggable={isCustomizing}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
          containerPadding={[16, 16]}
        >
          {layout.visibility.showLogs && (
            <div
              key="status"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
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
            </div>
          )}
          {layout.visibility.showLogs && (
            <div
              key="train"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <Typography sx={{ mb: 1, color: "text.primary" }}>
                Train
              </Typography>
              <Box className="muscle-icon-container">
                {readyToTrain.length > 0 ? (
                  readyToTrain.map((muscle, index) => (
                    <Box key={`ready-${index}`}>
                      {renderMuscleGroup(muscle)}
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: "text.secondary" }}>
                    No muscle groups are ready to train.
                  </Typography>
                )}
              </Box>
            </div>
          )}
          {layout.visibility.showLogs && (
            <div
              key="rest"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <Typography sx={{ mb: 1, color: "text.primary" }}>
                Rest
              </Typography>
              <Box className="muscle-icon-container">
                {restMuscles.length > 0 ? (
                  restMuscles.map((muscle, index) => (
                    <Box key={`rest-${index}`}>{renderMuscleGroup(muscle)}</Box>
                  ))
                ) : (
                  <Typography sx={{ color: "text.secondary" }}>
                    No muscle groups need rest.
                  </Typography>
                )}
              </Box>
            </div>
          )}
          {layout.visibility.showLogs && (
            <div
              key="workout-logs"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
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
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="muscle-distribution"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton onClick={handleReloadCharts} size="small">
                  <RefreshIcon sx={{ color: "text.primary" }} />
                </IconButton>
              </Box>
              <MuscleGroupDistributionChart
                logs={logs}
                muscleGroups={(exercises || []).map(
                  (exercise) => exercise.muscleGroup
                )}
              />
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="workout-count"
              className="card hightLightBox"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <p
                className="highLightLBL"
                style={{
                  fontSize: "2.5rem",
                  marginTop: "-12px",
                  color: theme.palette.text.primary,
                }}
              >
                {logs?.length || 0}
              </p>{" "}
              Workouts logged
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="total-volume"
              className="card hightLightBox"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <p
                className="highLightLBL"
                style={{
                  fontSize: "2.5rem",
                  marginTop: "-12px",
                  color: theme.palette.text.primary,
                }}
              >
                {logs?.reduce((p, c) => {
                  const reps = parseFloat(c[3]) || 0;
                  const weight = parseFloat(c[4]) || 0;
                  return p + reps * weight;
                }, 0) || 0}
              </p>{" "}
              Total Volume logged
            </div>
          )}
          <div
            key="todo-list"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <TodoList />
          </div>
          {layout.visibility.showSummary && (
            <div
              key="workout-summary"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton onClick={handleReloadSummary} size="small">
                  <RefreshIcon sx={{ color: "text.primary" }} />
                </IconButton>
              </Box>
              <WorkoutSummaryTable logs={logs} />
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="progression-fatigue"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <ProgressionFatigueChart
                logs={logs || []}
                dailyMetrics={logs || []}
              />
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="progression-muscle"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <ProgressionByMuscleChart
                logs={logs || []}
                dailyMetrics={logs || []}
              />
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="volume-over-time"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <VolumeOverTimeChart
                logs={logs || []}
                dates={(logs || []).map((log) => log.date)}
              />
            </div>
          )}
          {layout.visibility.showCharts && (
            <div
              key="fatigue-by-muscle"
              className="card"
              style={{ backgroundColor: theme.palette.background.paper }}
            >
              <FatigueByMuscleChart
                logs={logs || []}
                muscleGroups={(exercises || []).map(
                  (exercise) => exercise.muscleGroup
                )}
                onReadyToTrainUpdate={(musclesToWorkout, musclesToRest) =>
                  handleReadyToTrainUpdate(musclesToWorkout, musclesToRest)
                }
              />
            </div>
          )}
          <div
            key="progress-goals"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <Typography className="card-title" sx={{ color: "text.primary" }}>
              Progress Goals
            </Typography>
            <ProgressGoals logs={logs} />
          </div>
          <div
            key="body-weight"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
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
            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              Last recorded: {lastRecordedDate || "Not recorded yet"}
            </Typography>
          </div>
          <div
            key="achievements"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <AchievementsCard logs={logs} />
          </div>
          <div
            key="weekly-summary"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <WeeklySummaryCard logs={logs} />
          </div>
          <div
            key="monthly-summary"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <MonthlySummaryCard logs={logs} />
          </div>
          <div
            key="streak-tracker"
            className="card"
            style={{ backgroundColor: theme.palette.background.paper }}
          >
            <StreakTracker logs={logs} />
          </div>
        </ResponsiveGridLayout>

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
          onResetLayout={handleResetLayout}
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
