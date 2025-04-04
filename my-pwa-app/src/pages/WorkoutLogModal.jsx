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
  Snackbar,
  CircularProgress,
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
    return now.toISOString().split("T")[0];
  };

  const [log, setLog] = useState({
    date: getTodayDate(),
    muscleGroup: "",
    exercise: "",
    reps: "",
    weight: "",
    rating: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = getTodayDate();
    if (editLog) {
      let initialDate = today;
      if (editLog.originalIndex !== undefined && editLog.date) {
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
      setLog({
        date: today,
        muscleGroup: editLog?.muscleGroup || "",
        exercise: editLog?.exercise || "",
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

  const validateInputs = () => {
    if (
      !log.date ||
      !log.muscleGroup ||
      !log.exercise ||
      !log.reps ||
      !log.weight ||
      !log.rating
    ) {
      return "All fields are required";
    }
    if (
      isNaN(log.reps) ||
      parseInt(log.reps) <= 0 ||
      parseInt(log.reps) > 100
    ) {
      return "Reps must be a number between 1 and 100";
    }
    if (
      isNaN(log.weight) ||
      parseFloat(log.weight) < 0 ||
      parseFloat(log.weight) > 1000
    ) {
      return "Weight must be a number between 0 and 1000 kg";
    }
    // if (
    //   !/^[a-zA-Z\s]+$/.test(log.muscleGroup) ||
    //   !/^[a-zA-Z\s]+$/.test(log.exercise)
    // ) {
    //   return "Muscle Group and Exercise must contain only letters and spaces";
    // }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot save workout offline" });
      return;
    }

    setLoading(true);
    const row = [
      log.date,
      log.muscleGroup,
      log.exercise,
      log.reps,
      log.weight,
      log.rating,
    ];

    try {
      if (editLog && onSave && editLog.originalIndex !== undefined) {
        await onSave(row, editLog.originalIndex);
        setMessage({ type: "success", text: "Workout updated successfully" });
      } else {
        await appendData("Workout_Logs!A:F", row);
        const cachedData = (await loadCachedData("/api/workout")) || [];
        await cacheData("/api/workout", [...cachedData, row]);
        setMessage({ type: "success", text: "Workout logged successfully" });
      }

      if (
        !muscleGroups.includes(log.muscleGroup) ||
        !allExercises.includes(log.exercise)
      ) {
        await appendData("Exercises!A:B", [log.muscleGroup, log.exercise]);
        const cachedExercises = (await loadCachedData("/api/exercises")) || [];
        await cacheData("/api/exercises", [
          ...cachedExercises,
          { muscleGroup: log.muscleGroup, exercise: log.exercise },
        ]);
      }

      setTimeout(() => {
        setLog({
          date: getTodayDate(),
          muscleGroup: "",
          exercise: "",
          reps: "",
          weight: "",
          rating: "",
        });
        setMessage(null);
        setLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
      setLoading(false);
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
        {loading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />
        )}
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
          options={filteredMuscleGroups}
          value={log.muscleGroup}
          onChange={(e, newValue) =>
            setLog({ ...log, muscleGroup: newValue || "" })
          }
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              label="Muscle Group"
              margin="normal"
              fullWidth
              placeholder="Select or type"
            />
          )}
        />
        <Autocomplete
          options={filteredExercises}
          value={log.exercise}
          onChange={(e, newValue) =>
            setLog({ ...log, exercise: newValue || "" })
          }
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exercise"
              margin="normal"
              fullWidth
              placeholder="Select or type"
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
          inputProps={{ min: 1, max: 100 }}
        />
        <TextField
          label="Weight (kg)"
          type="number"
          value={log.weight}
          onChange={(e) => setLog({ ...log, weight: e.target.value })}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, max: 1000 }}
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
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Close
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isOffline || loading}
        >
          {editLog && editLog.originalIndex !== undefined ? "Save" : "Submit"}
        </Button>
      </DialogActions>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        message={message?.text}
      />
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
