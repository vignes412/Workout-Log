import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Box
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutIcon,
  DateRange as TemplatesIcon,
  List as ExercisesIcon,
  CheckCircle as TodoListIcon
} from '@mui/icons-material';

interface DashboardSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onNavigate,
  currentPage
}) => {
  const theme = useTheme();
  const drawerWidth = 240;

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      page: 'dashboard',
      onClick: () => onNavigate('dashboard')
    },
    { 
      text: 'Workout', 
      icon: <WorkoutIcon />, 
      page: 'workout',
      onClick: () => onNavigate('workout')
    },
    { 
      text: 'Templates', 
      icon: <TemplatesIcon />, 
      page: 'templates',
      onClick: () => onNavigate('templates')
    },
    { 
      text: 'Exercises', 
      icon: <ExercisesIcon />, 
      page: 'exercises',
      onClick: () => onNavigate('exercises')
    },
    { 
      text: 'Todo List', 
      icon: <TodoListIcon />, 
      page: 'todo',
      onClick: () => onNavigate('todo')
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box 
        sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          sx={{ height: 40 }}
          src="/logo192.png"
          alt="Workout Log"
        />
      </Box>
      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={item.onClick}
            selected={currentPage === item.page}
            sx={{
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
              '&:hover': {
                backgroundColor: `${theme.palette.action.hover}`,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: currentPage === item.page ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: currentPage === item.page ? 'bold' : 'normal',
                color: currentPage === item.page ? theme.palette.primary.main : 'inherit',
              }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider />
    </Drawer>
  );
};

export default React.memo(DashboardSidebar);