import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { appendData, cacheData, loadCachedData } from "../utils/sheetsApi";
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

const WorkoutLogModal = ({
  open = false,
  onClose,
  exercises,
  isOffline,
  editLog,
  onSave,
}) => {
  const getTodayDate = () => {
    const now = new Date();
    // Format as YYYY-MM-DD for type="date" input
    return now.toISOString().split("T")[0];
  };

  const [log, setLog] = useState({
    date: getTodayDate(), // Default to today
    muscleGroup: "",
    exercise: "",
    reps: "",
    weight: "",
    rating: "",
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const today = getTodayDate();
    if (editLog) {
      // For editing an existing log with originalIndex, use the original date if provided
      let initialDate = today;
      if (editLog.originalIndex !== undefined && editLog.date) {
        // Convert DD/MM/YYYY to YYYY-MM-DD if needed
        const [day, month, year] = editLog.date.split("/");
        initialDate = `${year}-${month}-${day}`;
      }
      setLog({
        date: initialDate,
        muscleGroup: editLog.muscleGroup || "",
        exercise: editLog.exercise || "",
        reps: editLog.reps.toString() || "",
        weight: editLog.weight.toString() || "",
        rating: editLog.rating?.toString() || "",
      });
    } else {
      // For new logs (including from Workout Planner), use today
      setLog({
        date: today,
        muscleGroup: editLog?.muscleGroup || "", // Pre-fill from Workout Planner if present
        exercise: editLog?.exercise || "", // Pre-fill from Workout Planner if present
        reps: editLog?.reps?.toString() || "",
        weight: editLog?.weight?.toString() || "",
        rating: editLog?.rating?.toString() || "",
      });
    }
  }, [editLog, open]);

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))];
  const allExercises = [...new Set(exercises.map((e) => e.exercise))];

  const filteredMuscleGroups = log.exercise
    ? [
        ...new Set(
          exercises
            .filter((e) => e.exercise === log.exercise)
            .map((e) => e.muscleGroup)
        ),
      ]
    : muscleGroups;

  const filteredExercises = log.muscleGroup
    ? [
        ...new Set(
          exercises
            .filter((e) => e.muscleGroup === log.muscleGroup)
            .map((e) => e.exercise)
        ),
      ]
    : allExercises;

  const handleMuscleGroupChange = (event, newValue) => {
    setLog((prev) => ({
      ...prev,
      muscleGroup: newValue || "",
    }));
  };

  const handleExerciseChange = (event, newValue) => {
    setLog((prev) => ({
      ...prev,
      exercise: newValue || "",
    }));
  };

  const handleSubmit = async () => {
    const { date, muscleGroup, exercise, reps, weight, rating } = log;
    if (!date || !muscleGroup || !exercise || !reps || !weight || !rating) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot save workout offline" });
      return;
    }

    // Convert YYYY-MM-DD to DD/MM/YYYY for storage
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}/${month}/${year}`;
    const row = [formattedDate, muscleGroup, exercise, reps, weight, rating];

    try {
      if (editLog && onSave && editLog.originalIndex !== undefined) {
        console.log(
          "Updating workout log:",
          row,
          "at index:",
          editLog.originalIndex
        );
        await onSave(row, editLog.originalIndex);
        setMessage({ type: "success", text: "Workout updated successfully" });
      } else {
        console.log("Appending new workout log:", row);
        await appendData("Workout_Logs!A:F", row);
        const cachedData = (await loadCachedData("/api/workout")) || [];
        await cacheData("/api/workout", [...cachedData, row]);
        setMessage({ type: "success", text: "Workout logged successfully" });
      }

      if (
        !muscleGroups.includes(muscleGroup) ||
        !allExercises.includes(exercise)
      ) {
        console.log("Adding new exercise to Exercises sheet:", [
          muscleGroup,
          exercise,
        ]);
        await appendData("Exercises!A:B", [muscleGroup, exercise]);
        const cachedExercises = (await loadCachedData("/api/exercises")) || [];
        await cacheData("/api/exercises", [
          ...cachedExercises,
          { muscleGroup, exercise },
        ]);
      }

      setTimeout(() => {
        setLog({
          date: getTodayDate(), // Reset to today
          muscleGroup: "",
          exercise: "",
          reps: "",
          weight: "",
          rating: "",
        });
        setMessage(null);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error in handleSubmit:", error.message, error.stack);
      setMessage({
        type: "error",
        text: editLog
          ? `Error updating workout: ${error.message}`
          : `Error logging workout: ${error.message}`,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" color="primary">
          {editLog && editLog.originalIndex !== undefined
            ? "Edit Workout Log"
            : "Add Workout Log"}
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
          // Always editable, no disabled prop
        />
        <Autocomplete
          options={filteredMuscleGroups}
          value={log.muscleGroup}
          onChange={handleMuscleGroupChange}
          freeSolo
          // Removed disabled prop, always editable
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
          options={filteredExercises}
          value={log.exercise}
          onChange={handleExerciseChange}
          freeSolo
          // Removed disabled prop, always editable
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
          label="Weight (kg)"
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
          {editLog && editLog.originalIndex !== undefined ? "Save" : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WorkoutLogModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  exercises: PropTypes.arrayOf(
    PropTypes.shape({
      muscleGroup: PropTypes.string,
      exercise: PropTypes.string,
      exerciseLink: PropTypes.string,
      imageLink: PropTypes.string,
    })
  ).isRequired,
  isOffline: PropTypes.bool.isRequired,
  editLog: PropTypes.shape({
    date: PropTypes.string,
    muscleGroup: PropTypes.string,
    exercise: PropTypes.string,
    reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    originalIndex: PropTypes.number,
  }),
  onSave: PropTypes.func,
};

export default WorkoutLogModal;
