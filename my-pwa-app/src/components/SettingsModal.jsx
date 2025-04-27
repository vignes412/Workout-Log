import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";

const SettingsModal = ({ open, onClose, onUpdateLayout, onResetLayout }) => {
  const [visibility, setVisibility] = useState({
    showLogs: true,
    showSummary: true,
    showCharts: true,
  });

  const handleVisibilityChange = (event) => {
    const { name, checked } = event.target;
    setVisibility((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = () => {
    onUpdateLayout((prev) => ({
      ...prev,
      visibility,
    }));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dashboard Settings
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={visibility.showLogs}
              onChange={handleVisibilityChange}
              name="showLogs"
            />
          }
          label="Show Workout Logs"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={visibility.showSummary}
              onChange={handleVisibilityChange}
              name="showSummary"
            />
          }
          label="Show Workout Summary"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={visibility.showCharts}
              onChange={handleVisibilityChange}
              name="showCharts"
            />
          }
          label="Show Charts"
        />
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outlined" onClick={onResetLayout}>
            Reset Layout
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SettingsModal;
