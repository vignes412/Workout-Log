import React, { useMemo } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Divider,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FitnessCenter as FitnessCenterIcon,
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  TodayOutlined as TodayIcon,
  BarChart as BarChartIcon,
  AccountCircle as AccountIcon,
  Science as ScienceIcon,
  CheckBox as CheckBoxIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: React.ReactElement;
}

const DRAWER_WIDTH = 240;
const CLOSED_DRAWER_WIDTH = 60;

const AppSidebar: React.FC = () => {
  const { state, navigateTo, toggleTheme, toggleDrawer } = useAppContext();
  const { currentPage, isDrawerOpen, themeMode } = state;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems: NavItem[] = useMemo(() => [
    {
      key: 'dashboard',
      path: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />
    },
    {
      key: 'todaysWorkout',
      path: 'todaysWorkout',
      label: "Today's Workout",
      icon: <TodayIcon />
    },
    {
      key: 'workoutTemplates',
      path: 'workoutTemplates',
      label: 'Workout Templates',
      icon: <FitnessCenterIcon />
    },
    {
      key: 'bodyMeasurements',
      path: 'bodyMeasurements',
      label: 'Body Measurements',
      icon: <ScienceIcon />
    },
    {
      key: 'workoutHistory',
      path: 'workoutHistory',
      label: 'Workout History',
      icon: <BarChartIcon />
    },
    {
      key: 'todoList',
      path: 'todoList',
      label: 'Todo List',
      icon: <CheckBoxIcon />
    },
    {
      key: 'profile',
      path: 'profile',
      label: 'Profile',
      icon: <AccountIcon />
    }
  ], []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isDrawerOpen ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH,
        flexShrink: 0,
        position: 'fixed',
        '& .MuiDrawer-paper': {
          width: isDrawerOpen ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          overflowX: 'hidden',
          bgcolor: themeMode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          borderRight: themeMode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
          position: 'fixed',
          height: '100vh',
          zIndex: theme.zIndex.drawer,
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: isDrawerOpen ? 'flex-end' : 'center',
        p: 1,
        minHeight: 56,
      }}>
        <IconButton onClick={toggleDrawer}>
          {isDrawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.key}
            disablePadding
            sx={{
              minHeight: 48,
              borderRadius: 1,
              overflow: 'hidden',
              my: 0.5,
              mx: 0.5
            }}
          >
            <Tooltip 
              title={!isDrawerOpen ? item.label : ''}
              placement="right"
            >
              <Box
                onClick={() => navigateTo(item.path)}
                component="div"
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  minHeight: 48,
                  cursor: 'pointer',
                  justifyContent: isDrawerOpen ? 'initial' : 'center',
                  backgroundColor: currentPage === item.path ? (themeMode === 'dark' ? '#333' : '#e0e0e0') : 'transparent',
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' ? '#444' : '#ddd',
                  },
                  borderRadius: 1
                }}
              >
                <ListItemIcon 
                  sx={{
                    minWidth: 0,
                    mr: isDrawerOpen ? 2 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isDrawerOpen && (
                  <ListItemText 
                    primary={item.label} 
                    sx={{ 
                      opacity: isDrawerOpen ? 1 : 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} 
                  />
                )}
              </Box>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <Tooltip 
          title={!isDrawerOpen ? (themeMode === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
          placement="right"
        >
          <ListItem 
            disablePadding
            sx={{
              minHeight: 48,
              borderRadius: 1,
              overflow: 'hidden',
              my: 0.5,
              mx: 0.5
            }}
          >
            <Box
              onClick={toggleTheme}
              component="div"
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                px: 2,
                py: 1,
                minHeight: 48,
                cursor: 'pointer',
                justifyContent: isDrawerOpen ? 'initial' : 'center',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: themeMode === 'dark' ? '#444' : '#ddd',
                }
              }}
            >
              <ListItemIcon 
                sx={{
                  minWidth: 0,
                  mr: isDrawerOpen ? 2 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              {isDrawerOpen && (
                <ListItemText 
                  primary={themeMode === 'light' ? 'Dark Mode' : 'Light Mode'} 
                  sx={{ 
                    opacity: isDrawerOpen ? 1 : 0,
                    whiteSpace: 'nowrap' 
                  }} 
                />
              )}
            </Box>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default React.memo(AppSidebar);