import React from "react";
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Avatar 
} from "@mui/material";
import { 
  Brightness4, 
  Brightness7, 
  Settings,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from "@mui/icons-material";

const DashboardHeader = ({ 
  toggleTheme, 
  themeMode, 
  handleReloadData, 
  isCustomizing, 
  toggleCustomizeMode, 
  handleLogout,
  handleSettingsOpen
}) => {
  return (
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
        <IconButton
          onClick={() => handleSettingsOpen(true)}
          sx={{ color: "text.primary" }}
        >
          <Settings sx={{ color: "text.primary" }} />
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
  );
};

export default DashboardHeader;