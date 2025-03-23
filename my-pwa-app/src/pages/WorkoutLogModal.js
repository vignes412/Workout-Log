// src/pages/WorkoutLogModal.js
import React, { useState } from "react";
import { appendData, cacheData, fetchData, loadCachedData } from "../utils/sheetsApi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const WorkoutLogModal = ({ open, onClose, exercises, isOffline }) => {
  const [log, setLog] = useState({
    date: "",
    muscleGroup: "",
    exercise: "",
    reps: "",
    weight: "",
    rating: "",
  });
  const [message, setMessage] = useState(null);

  // Extract unique muscle groups
  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))];
  // Filter exercises based on selected muscle group
  const exerciseOptions = exercises
    .filter((e) => e.muscleGroup === log.muscleGroup)
    .map((e) => e.exercise);

  const handleSubmit = async () => {
    const { date, muscleGroup, exercise, reps, weight, rating } = log;
    if (!date || !muscleGroup || !exercise || !reps || !weight || !rating) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot log workout offline" });
      return;
    }

    try {
      // Check if muscle group and exercise exist in Exercises sheet; add if not
      if (
        !muscleGroups.includes(muscleGroup) ||
        !exerciseOptions.includes(exercise)
      ) {
        await appendData("Exercises!A:B", [muscleGroup, exercise]);
        await cacheData("/api/exercises", [
          ...((await loadCachedData("/api/exercises")) || []),
          { muscleGroup, exercise },
        ]);
        setMessage({ type: "success", text: "New exercise added to list" });
      }

      // Log the workout
      const row = [date, muscleGroup, exercise, reps, weight, rating];
      await appendData("Workout_Logs!A:F", row);
      await cacheData("/api/workout", [
        ...((await loadCachedData("/api/workout")) || []),
        row,
      ]);

      setMessage({ type: "success", text: "Workout logged successfully" });
      setTimeout(() => {
        setLog({
          date: "",
          muscleGroup: "",
          exercise: "",
          reps: "",
          weight: "",
          rating: "",
        });
        onClose();
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error logging workout or adding exercise",
      });
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" color="primary">
          Add Workout Log
        </Typography>
      </DialogTitle>
      <DialogContent>
        {message && (
          <Typography
            color={message.type === "error" ? "error" : "success"}
            sx={{ mb: 2 }}
          >
            {message.text}
          </Typography>
        )}
        <TextField
          label="Date"
          type="date"
          value={log.date}
          onChange={(e) => setLog({ ...log, date: e.target.value })}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <Autocomplete
          freeSolo
          options={muscleGroups}
          value={log.muscleGroup}
          onChange={(e, newValue) =>
            setLog({ ...log, muscleGroup: newValue || "", exercise: "" })
          }
          onInputChange={(e, newInputValue) =>
            setLog({ ...log, muscleGroup: newInputValue, exercise: "" })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Muscle Group"
              margin="normal"
              fullWidth
              placeholder="Select or type a muscle group"
            />
          )}
        />
        <Autocomplete
          freeSolo
          options={exerciseOptions}
          value={log.exercise}
          onChange={(e, newValue) =>
            setLog({ ...log, exercise: newValue || "" })
          }
          onInputChange={(e, newInputValue) =>
            setLog({ ...log, exercise: newInputValue })
          }
          disabled={!log.muscleGroup}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exercise"
              margin="normal"
              fullWidth
              placeholder="Select or type an exercise"
            />
          )}
        />
        <TextField
          label="Reps"
          type="number"
          value={log.reps}
          onChange={(e) => setLog({ ...log, reps: e.target.value })}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Weight (lbs)"
          type="number"
          value={log.weight}
          onChange={(e) => setLog({ ...log, weight: e.target.value })}
          fullWidth
          margin="normal"
          inputProps={{ min: 0 }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Rating (1-10)</InputLabel>
          <Select
            value={log.rating}
            onChange={(e) => setLog({ ...log, rating: e.target.value })}
            label="Rating (1-10)"
          >
            <MenuItem value="">Select Rating</MenuItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isOffline}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkoutLogModal;
