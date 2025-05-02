import React from "react";
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Avatar,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem
} from "@mui/material";
import { 
  Brightness4, 
  Brightness7, 
  Settings,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  MoreVert as MoreIcon
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="header" sx={{ bgcolor: "background.paper" }}>
      <Typography
        className="header-greeting"
        sx={{ 
          fontSize: isMobile ? "1.2rem" : "1.5rem", 
          fontWeight: 600, 
          color: "text.primary" 
        }}
      >
        Hi, RV!
      </Typography>
      
      {isMobile ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton 
              onClick={isCustomizing ? toggleCustomizeMode : handleReloadData}
              color="primary"
            >
              {isCustomizing ? <SaveIcon /> : <RefreshIcon />}
            </IconButton>
            
            <IconButton
              onClick={handleMenuOpen}
              edge="end"
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { toggleCustomizeMode(); handleMenuClose(); }}>
                {isCustomizing ? "Save Layout" : "Customize"}
              </MenuItem>
              <MenuItem onClick={() => { toggleTheme(); handleMenuClose(); }}>
                {themeMode === "light" ? "Dark Mode" : "Light Mode"}
              </MenuItem>
              <MenuItem onClick={() => { handleSettingsOpen(true); handleMenuClose(); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </>
      ) : (
        <>
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
        </>
      )}
    </Box>
  );
};

export default DashboardHeader;