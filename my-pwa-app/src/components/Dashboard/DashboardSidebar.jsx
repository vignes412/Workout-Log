import React from "react";
import { Box } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Message as MessagesIcon,
} from "@mui/icons-material";

const DashboardSidebar = ({ onNavigate }) => {
  return (
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
    </Box>
  );
};

export default DashboardSidebar;