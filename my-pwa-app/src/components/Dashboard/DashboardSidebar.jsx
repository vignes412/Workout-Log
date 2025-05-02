import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Message as MessagesIcon,
} from "@mui/icons-material";

const DashboardSidebar = ({ onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      className="sidebar" 
      sx={{ 
        bgcolor: "background.paper",
        boxShadow: isMobile ? '0px -2px 4px rgba(0,0,0,0.1)' : '2px 0 4px rgba(0,0,0,0.1)'
      }}
    >
      <Box
        className="sidebar-item"
        onClick={() => onNavigate("dashboard")}
        sx={{ 
          "&:hover": { bgcolor: "action.hover" },
          flex: isMobile ? 1 : 'unset',
          justifyContent: 'center'
        }}
      >
        <DashboardIcon sx={{ color: "text.primary" }} />
        <span>Dashboard</span>
      </Box>
      <Box
        className="sidebar-item"
        onClick={() => onNavigate("exerciselist")}
        sx={{ 
          "&:hover": { bgcolor: "action.hover" },
          flex: isMobile ? 1 : 'unset',
          justifyContent: 'center'
        }}
      >
        <WorkoutsIcon sx={{ color: "text.primary" }} />
        <span>Workouts</span>
      </Box>
      <Box
        className="sidebar-item"
        onClick={() => onNavigate("bodymeasurements")}
        sx={{ 
          "&:hover": { bgcolor: "action.hover" },
          flex: isMobile ? 1 : 'unset',
          justifyContent: 'center'
        }}
      >
        <BodyMeasurementsIcon sx={{ color: "text.primary" }} />
        <span>Body</span>
      </Box>
      <Box
        className="sidebar-item"
        sx={{ 
          "&:hover": { bgcolor: "action.hover" },
          flex: isMobile ? 1 : 'unset',
          justifyContent: 'center'
        }}
      >
        <MessagesIcon sx={{ color: "text.primary" }} />
        <span>Messages</span>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;