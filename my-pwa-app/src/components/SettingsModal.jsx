import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const SettingsModal = ({ open, onClose, onUpdateLayout }) => {
  const [layout, setLayout] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("dashboardLayout")) || {
        showLogs: true,
        showSummary: true,
        showCharts: true,
      }
    );
  });

  useEffect(() => {
    localStorage.setItem("dashboardLayout", JSON.stringify(layout));
    onUpdateLayout(layout);
  }, [layout, onUpdateLayout]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" color="primary">
          Dashboard Settings
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={layout.showLogs}
              onChange={(e) =>
                setLayout({ ...layout, showLogs: e.target.checked })
              }
            />
          }
          label="Show Workout Logs"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={layout.showSummary}
              onChange={(e) =>
                setLayout({ ...layout, showSummary: e.target.checked })
              }
            />
          }
          label="Show Workout Summary"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={layout.showCharts}
              onChange={(e) =>
                setLayout({ ...layout, showCharts: e.target.checked })
              }
            />
          }
          label="Show Charts"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
