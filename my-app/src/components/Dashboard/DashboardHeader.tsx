import React from 'react';
import {
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { widgetTitles } from './dashboardUtils';
import { useDashboard } from '../../context/DashboardContext';

interface DashboardHeaderProps {
  handleMobileMenuOpen?: (event: React.MouseEvent<HTMLElement>) => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  handleMobileMenuOpen,
  onLogout,
  onOpenSettings
}) => {
  const theme = useTheme();
  const [visibilityMenuAnchor, setVisibilityMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  
  const {
    isCustomizing,
    toggleCustomizing,
    saveLayout,
    resetLayout,
    layout,
    toggleWidgetVisibility,
    reloadData
  } = useDashboard();

  const handleVisibilityMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setVisibilityMenuAnchor(event.currentTarget);
  };

  const handleVisibilityMenuClose = () => {
    setVisibilityMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
    handleUserMenuClose();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    handleUserMenuClose();
  };

  const startCustomize = () => {
    toggleCustomizing();
  };

  const saveCustomize = () => {
    saveLayout();
  };

  const cancelCustomize = () => {
    toggleCustomizing();
  };

  // Render the widget visibility menu
  const renderVisibilityMenu = () => {
    return (
      <Menu
        id="visibility-menu"
        anchorEl={visibilityMenuAnchor}
        open={Boolean(visibilityMenuAnchor)}
        onClose={handleVisibilityMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            maxHeight: '80vh',
            width: '250px',
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Widget Visibility
        </Typography>
        
        {Object.keys(layout.visibility).map((widgetId) => (
          <MenuItem 
            key={widgetId}
            onClick={() => toggleWidgetVisibility(widgetId)}
            dense
          >
            <ListItemIcon>
              {layout.visibility[widgetId] ? 
                <VisibilityIcon color="primary" /> : 
                <VisibilityOffIcon color="action" />
              }
            </ListItemIcon>
            <ListItemText 
              primary={widgetTitles[widgetId] || widgetId} 
              primaryTypographyProps={{ 
                color: layout.visibility[widgetId] ? 'textPrimary' : 'textSecondary',
                variant: 'body2'
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    );
  };

  // Render the user menu for settings and logout
  const renderUserMenu = () => {
    return (
      <Menu
        id="user-menu"
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleOpenSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    );
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        mb: 2,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2
      }}
      className="dashboard-header"
    >
      <Toolbar sx={{ px: 2 }}>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
          onClick={handleMobileMenuOpen}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Dashboard
          {isCustomizing && (
            <Typography 
              component="span" 
              variant="subtitle1" 
              color="primary" 
              sx={{ ml: 2 }}
            >
              (Customizing)
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isCustomizing ? (
            <>
              <Tooltip title="Widget Visibility">
                <IconButton
                  color="primary"
                  onClick={handleVisibilityMenuOpen}
                  aria-label="toggle widget visibility"
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset Layout">
                <IconButton
                  color="warning"
                  onClick={resetLayout}
                  aria-label="reset layout"
                  sx={{ ml: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Save Layout">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveCustomize}
                  sx={{ ml: 2 }}
                >
                  Save
                </Button>
              </Tooltip>
              
              <Tooltip title="Cancel">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={cancelCustomize}
                  sx={{ ml: 1 }}
                >
                  Cancel
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Reload Data">
                <IconButton
                  color="primary"
                  onClick={() => reloadData()}
                  aria-label="reload data"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            
              <Tooltip title="Customize Dashboard">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={startCustomize}
                  sx={{ ml: 1, mr: 2 }}
                >
                  Customize
                </Button>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton 
                  color="inherit" 
                  onClick={onOpenSettings}
                  aria-label="settings"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Account & Logout">
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuOpen}
                  aria-label="account settings"
                  sx={{ ml: 1 }}
                >
                  <AccountIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>
      {renderVisibilityMenu()}
      {renderUserMenu()}
    </Paper>
  );
};

export default React.memo(DashboardHeader);