import React, { useState, useCallback, memo, ReactNode, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Divider, 
  useMediaQuery, 
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  FitnessCenter,
  CalendarToday as CalendarIcon,
  ShowChart as ProgressIcon,
  Settings as SettingsIcon,
  CheckCircle as TodoIcon,
  Create as LogIcon,
  SwapHoriz as ExpandIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

interface PageConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
}

interface LayoutProps {
  children: ReactNode;
}

const pages: PageConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'workoutTemplates', label: 'Workout Templates', icon: <FitnessCenter /> },
  { id: 'todaysWorkout', label: "Today's Workout", icon: <FitnessCenter /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { id: 'progress', label: 'Progress', icon: <ProgressIcon /> },
  { id: 'todos', label: 'Todo List', icon: <TodoIcon /> },
  { id: 'workoutLogs', label: 'Workout Logs', icon: <LogIcon /> }
];

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 64;

const AppLayout = memo(({ children }: LayoutProps) => {
  // Get values from context with fallbacks for missing properties
  const context = useAppContext();
  const state = context?.state || { currentPage: 'dashboard', isDarkMode: false };
  const toggleTheme = context?.toggleTheme || (() => console.warn('toggleTheme not available'));
  const setCurrentPage = context?.setCurrentPage || (() => console.warn('setCurrentPage not available'));
  const contextToggleDrawer = context?.toggleDrawer;
  
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fix console errors by handling undefined or missing properties safely
  const safeToggleDrawer = useCallback(() => {
    const newState = !open;
    setOpen(newState);
    
    // Only call context toggleDrawer if it exists
    if (typeof contextToggleDrawer === 'function') {
      try {
        contextToggleDrawer();
      } catch (error) {
        console.error('Error toggling drawer in context:', error);
      }
    }
    
    // Apply class to body to help with CSS overrides
    if (newState) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
  }, [open, contextToggleDrawer]);
  
  // Initialize body class on mount and sync with context
  useEffect(() => {
    // Only update if state.isDrawerOpen is a boolean (not undefined)
    if (state && typeof state.isDrawerOpen === 'boolean' && state.isDrawerOpen !== open) {
      setOpen(state.isDrawerOpen);
      
      if (state.isDrawerOpen) {
        document.body.classList.add('sidebar-expanded');
      } else {
        document.body.classList.remove('sidebar-expanded');
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-expanded');
    };
  }, [state, open]);
  
  const handlePageChange = useCallback((pageId: string) => {
    if (typeof setCurrentPage === 'function') {
      try {
        setCurrentPage(pageId);
      } catch (error) {
        console.error('Error setting current page:', error);
      }
    }
    
    if (isMobile) {
      setOpen(false);
      
      // Update context if toggleDrawer exists and drawer is open
      if (typeof contextToggleDrawer === 'function' && 
          state && typeof state.isDrawerOpen === 'boolean' && 
          state.isDrawerOpen) {
        try {
          contextToggleDrawer();
        } catch (error) {
          console.error('Error toggling drawer in context during page change:', error);
        }
      }
    }
  }, [setCurrentPage, isMobile, state, contextToggleDrawer]);
  
  const drawer = (
    <>
      <Toolbar />
      <List>
        {pages.map((page) => (
          <ListItem 
            key={page.id}
            disablePadding
            sx={{ 
              my: 0.5, 
              px: 0,
              borderRadius: 1,
              mx: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              onClick={() => handlePageChange(page.id)}
              component="div"
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                px: 2.5,
                py: 1,
                cursor: 'pointer',
                justifyContent: open ? 'initial' : 'center',
                backgroundColor: state.currentPage === page.id ? 'primary.light' : 'transparent',
                color: state.currentPage === page.id ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: state.currentPage === page.id ? 'primary.main' : 'action.hover',
                },
                borderRadius: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: state.currentPage === page.id ? 'white' : 'inherit' }}>
                {page.icon}
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={page.label} 
                  sx={{ opacity: open ? 1 : 0, color: state.currentPage === page.id ? 'white' : 'inherit' }}
                />
              )}
            </Box>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 'auto' }}>
        <List>
          <ListItem 
            disablePadding
            sx={{ 
              justifyContent: open ? 'initial' : 'center',
              borderRadius: 1,
              mx: 1,
              cursor: 'pointer'
            }}
          >
            <Box
              onClick={safeToggleDrawer}
              component="div"
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                px: 2.5,
                py: 1,
                justifyContent: open ? 'initial' : 'center'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ExpandIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Collapse" />}
            </Box>
          </ListItem>
          <ListItem 
            disablePadding
            sx={{ 
              borderRadius: 1,
              mx: 1,
              cursor: 'pointer'
            }}
          >
            <Box
              onClick={typeof toggleTheme === 'function' ? toggleTheme : undefined}
              component="div"
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                px: 2.5,
                py: 1,
                justifyContent: open ? 'initial' : 'center'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {state.isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              {open && <ListItemText primary={state.isDarkMode ? "Light Mode" : "Dark Mode"} />}
            </Box>
          </ListItem>
        </List>
      </Box>
    </>
  );
  
  // Apply important flag to ensure styles override any conflicting CSS
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden' 
      }}
      className={open ? 'layout-drawer-open' : 'layout-drawer-closed'}
    >
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100% !important',
          left: '0 !important'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={safeToggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {pages.find(page => page.id === state.currentPage)?.label || 'Workout Tracker'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={isMobile ? safeToggleDrawer : undefined}
        sx={{
          width: isMobile ? DRAWER_WIDTH : (open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH),
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: isMobile ? DRAWER_WIDTH : (open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH),
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            position: 'fixed !important',
            height: '100% !important',
            top: '0 !important',
            left: '0 !important'
          }
        }}
      >
        {drawer}
      </Drawer>
      
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          p: 3,
          boxSizing: 'border-box !important',
          display: 'flex',
          flexDirection: 'column',
          transition: theme => theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: '0 !important' ,
          width: isMobile ? '100% !important' : (open ? `calc(100% - ${DRAWER_WIDTH}px) !important` : `calc(100% - ${MINI_DRAWER_WIDTH}px) !important`),
        }}
        className="app-main-content"
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;