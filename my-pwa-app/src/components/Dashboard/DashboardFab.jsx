import React from "react";
import { Fab, Menu, MenuItem } from "@mui/material";
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
  return (
    <>
      <Fab
        color="primary"
        onClick={handleMenuOpen}
        aria-label="add"
        className="fab-add"
        sx={{ "&:hover": { transform: "scale(1.1)" } }}
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
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { bgcolor: "background.paper" } }}
      >
        {recentLogs.length > 0 ? (
          recentLogs.map((log, index) => (
            <MenuItem
              key={index}
              onClick={() => handleQuickAdd(log)}
              sx={{ color: "text.primary" }}
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