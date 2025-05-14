import React from 'react';
import {
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  History as HistoryIcon,
  FitnessCenter
} from '@mui/icons-material';

interface DashboardFabProps {
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  handleMenuClose: () => void;
  setModalEditLog: (log: any) => void;
  setOpenModal: (open: boolean) => void;
  handleQuickAddOpen: (event: React.MouseEvent<HTMLElement>) => void;
  quickAddAnchorEl: HTMLElement | null;
  handleQuickAddClose: () => void;
  recentLogs: any[];
  handleQuickAdd: (log: any) => void;
}

const DashboardFab: React.FC<DashboardFabProps> = ({
  handleMenuOpen,
  anchorEl,
  handleMenuClose,
  setModalEditLog,
  setOpenModal,
  handleQuickAddOpen,
  quickAddAnchorEl,
  handleQuickAddClose,
  recentLogs,
  handleQuickAdd
}) => {
  return (
    <>
      <Fab
        color="primary"
        aria-label="add"
        className="fab-button"
        onClick={handleMenuOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem
          onClick={() => {
            setModalEditLog(null);
            setOpenModal(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log Workout</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleQuickAddOpen}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Quick Add Recent</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Quick Add Recent Menu */}
      <Menu
        anchorEl={quickAddAnchorEl}
        open={Boolean(quickAddAnchorEl)}
        onClose={handleQuickAddClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Recent Workouts
        </Typography>
        <Divider />
        
        {recentLogs.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No recent workouts
            </Typography>
          </MenuItem>
        ) : (
          recentLogs.map((log, index) => (
            <MenuItem key={index} onClick={() => handleQuickAdd(log)}>
              <ListItemIcon>
                <FitnessCenter fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={log.exercise}
                secondary={`${log.muscleGroup} - ${log.date}`}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default React.memo(DashboardFab);