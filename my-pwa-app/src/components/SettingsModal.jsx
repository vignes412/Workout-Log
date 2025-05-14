import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
} from "@mui/material";

const SettingsModal = ({ open, onClose, onUpdateLayout, onResetLayout, layout }) => {
  const handleVisibilityChange = (key) => {
    onUpdateLayout((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [key]: !prev.visibility[key],
      },
    }));
  };

  const handleClose = () => {
    localStorage.setItem("dashboardLayout", JSON.stringify(layout));
    onClose();
  };

  const cardNames = {
    status: "Status",
    train: "Train",
    rest: "Rest",
    "workout-features": "Workout Features",
    "workout-logs": "Workout Logs",
    "muscle-distribution": "Muscle Distribution Chart",
    "workout-count": "Workout Count",
    "total-volume": "Total Volume",
    "todo-list": "Todo List",
    "workout-summary": "Workout Summary",
    "progression-fatigue": "Progression Fatigue Chart",
    "progression-muscle": "Progression by Muscle Chart",
    "volume-over-time": "Volume Over Time Chart",
    "fatigue-by-muscle": "Fatigue by Muscle Chart",
    "progress-goals": "Progress Goals",
    "body-weight": "Body Weight",
    achievements: "Achievements",
    "weekly-summary": "Weekly Summary",
    "monthly-summary": "Monthly Summary",
    "streak-tracker": "Streak Tracker",
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dashboard Settings</DialogTitle>
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Card Visibility
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Object.keys(cardNames).map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={layout.visibility[key]}
                  onChange={() => handleVisibilityChange(key)}
                />
              }
              label={cardNames[key]}
            />
          ))}
        </Box>
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Layout Options
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onResetLayout}
          sx={{ mt: 2 }}
        >
          Reset Layout
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Save & Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;