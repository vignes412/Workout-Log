import React from "react";
import { Fab, Menu, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import { Add } from "@mui/icons-material";

const DashboardFab = ({ 
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <>
      <Fab
        color="primary"
        onClick={handleMenuOpen}
        aria-label="add"
        className="fab-add"
        size={isMobile ? "medium" : "large"}
        sx={{ 
          "&:hover": { transform: "scale(1.1)" },
          // Mobile specific styles - position above bottom nav
          ...(isMobile && {
            bottom: '70px',
            right: '16px'
          })
        }}
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
        anchorOrigin={isMobile ? 
          { vertical: "top", horizontal: "center" } : 
          { vertical: "top", horizontal: "left" }
        }
        transformOrigin={isMobile ? 
          { vertical: "bottom", horizontal: "center" } : 
          { vertical: "top", horizontal: "right" }
        }
        PaperProps={{ 
          sx: { 
            bgcolor: "background.paper",
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 'auto',
            maxHeight: isMobile ? '60vh' : 'auto'
          } 
        }}
      >
        {recentLogs.length > 0 ? (
          recentLogs.map((log, index) => (
            <MenuItem
              key={index}
              onClick={() => handleQuickAdd(log)}
              sx={{ 
                color: "text.primary",
                ...(isMobile && {
                  fontSize: '0.9rem',
                  py: 1.5
                })
              }}
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
    </>
  );
};

export default DashboardFab;