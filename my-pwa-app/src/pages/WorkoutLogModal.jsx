import React, { useState, useEffect, useMemo } from "react";
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
    restTime: "" // Added rest time field
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Use useMemo to prevent recalculation on every render
  const muscleGroups = useMemo(() => {
    try {
      return [...new Set((exercises || []).map((e) => e.muscleGroup))];
    } catch (err) {
      console.error("Error processing muscle groups:", err);
      return [];
    }
  }, [exercises]);
  
  const allExercises = useMemo(() => {
    try {
      return [...new Set((exercises || []).map((e) => e.exercise))];
    } catch (err) {
      console.error("Error processing exercises:", err);
      return [];
    }
  }, [exercises]);

  // This effect runs when the modal opens/closes or editLog changes
  useEffect(() => {
    if (open) {
      // Reset states when opening the modal
      setSubmitted(false);
      setLoading(false);
      setMessage(null);
      
      const today = getTodayDate();
      
      // Only update form if editLog is provided
      if (editLog) {
        console.log("Received edit log data:", editLog);
        
        // Parse date with proper fallback
        let initialDate = today;
        try {
          if (editLog.date) {
            if (typeof editLog.date === 'string') {
              if (editLog.date.includes('/')) {
                // Handle mm/dd/yyyy format
                const dateParts = editLog.date.split('/');
                if (dateParts.length === 3) {
                  const [month, day, year] = dateParts;
                  initialDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
              } else if (editLog.date.includes('-')) {
                // Already in YYYY-MM-DD format
                initialDate = editLog.date;
              }
            } else if (editLog.date instanceof Date) {
              initialDate = editLog.date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          initialDate = today;
        }
        
        // Important: Convert all values to strings to avoid type mismatches
        const updatedLog = {
          date: initialDate,
          muscleGroup: editLog.muscleGroup || "",
          exercise: editLog.exercise || "",
          reps: editLog.reps?.toString() || "",
          weight: editLog.weight?.toString() || "0",
          rating: editLog.rating?.toString() || "5",
          restTime: editLog.restTime?.toString() || "0",
          exerciseIndex: editLog.exerciseIndex !== undefined ? editLog.exerciseIndex : undefined,
          setIndex: editLog.setIndex !== undefined ? editLog.setIndex : undefined
        };
        
        console.log("Setting form with updated values:", updatedLog);
        
        // Set all values at once to prevent partial updates
        setLog(updatedLog);
      } else {
        // Reset to default values when opening without editLog
        setLog({
          date: today,
          muscleGroup: "",
          exercise: "",
          reps: "",
          weight: "",
          rating: "5", // Default rating
          restTime: "0"
        });
      }
    }
  }, [editLog, open]);

  // Use useMemo for filtered lists
  const filteredMuscleGroups = useMemo(() => {
    try {
      return log.exercise
        ? [...new Set(
            (exercises || [])
              .filter((e) => e.exercise === log.exercise)
              .map((e) => e.muscleGroup)
          )]
        : muscleGroups;
    } catch (err) {
      console.error("Error filtering muscle groups:", err);
      return muscleGroups;
    }
  }, [log.exercise, exercises, muscleGroups]);

  const filteredExercises = useMemo(() => {
    try {
      return log.muscleGroup
        ? [...new Set(
            (exercises || [])
              .filter((e) => e.muscleGroup === log.muscleGroup)
              .map((e) => e.exercise)
          )]
        : allExercises;
    } catch (err) {
      console.error("Error filtering exercises:", err);
      return allExercises;
    }
  }, [log.muscleGroup, exercises, allExercises]);

  const validateInputs = () => {
    if (
      !log.date ||
      !log.muscleGroup ||
      !log.exercise ||
      !log.reps ||
      !log.weight ||
      !log.rating ||
      !log.restTime
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
    if (
      isNaN(log.restTime) ||
      parseInt(log.restTime) < 0 ||
      parseInt(log.restTime) > 300
    ) {
      return "Rest time must be a number between 0 and 300 seconds";
    }
    return null;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    
    const validationError = validateInputs();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      setSubmitted(false);
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot save workout offline" });
      setSubmitted(false);
      return;
    }

    setLoading(true);
    
    // Create a copy of the log for the API
    const row = [
      log.date,
      log.muscleGroup,
      log.exercise,
      log.reps,
      log.weight,
      log.rating,
      log.restTime
    ];

    try {
      if (editLog && onSave && editLog.originalIndex !== undefined) {
        try {
          await onSave(row, editLog.originalIndex);
          setMessage({ type: "success", text: "Workout updated successfully" });
        } catch (innerError) {
          console.error("Error in onSave callback:", innerError);
          throw new Error(`Failed to save workout: ${innerError.message || 'Unknown error'}`);
        }
      } else {
        try {
          // First append the data to Google Sheets
          await appendData("Workout_Logs!A:G", row);
          
          // Then update the local cache
          try {
            const cachedData = (await loadCachedData("/api/workout")) || [];
            await cacheData("/api/workout", [...cachedData, row]);
          } catch (cacheError) {
            console.error("Error updating cache (non-critical):", cacheError);
          }
          
          setMessage({ type: "success", text: "Workout logged successfully" });
          
          // Call onSave callback to notify TodaysWorkout that the set was completed
          if (onSave) {
            try {
              // Pass along exerciseIndex if it exists
              if (log.exerciseIndex !== undefined) {
                await onSave(row, null, log.exerciseIndex, log.setIndex);
              } else {
                await onSave(row);
              }
            } catch (callbackError) {
              console.error("Error in onSave callback:", callbackError);
            }
          }
        } catch (dataError) {
          console.error("Error appending data:", dataError);
          throw new Error(`Failed to log workout: ${dataError.message || 'Unknown error'}`);
        }
      }

      // Handle adding new exercise if needed
      try {
        if (
          !muscleGroups.includes(log.muscleGroup) ||
          !allExercises.includes(log.exercise)
        ) {
          try {
            await appendData("Exercises!A:B", [log.muscleGroup, log.exercise]);
            const cachedExercises = (await loadCachedData("/api/exercises")) || [];
            await cacheData("/api/exercises", [
              ...cachedExercises,
              { muscleGroup: log.muscleGroup, exercise: log.exercise },
            ]);
          } catch (exerciseError) {
            console.error("Error saving new exercise:", exerciseError);
          }
        }
      } catch (exerciseProcessError) {
        console.error("Error processing new exercise:", exerciseProcessError);
      }

      // Use a delay to let the user see the success message
      setTimeout(() => {
        if (submitted) {
          setLog({
            date: getTodayDate(),
            muscleGroup: "",
            exercise: "",
            reps: "",
            weight: "",
            rating: "",
            restTime: ""
          });
          setMessage(null);
          setLoading(false);
          
          if (open && onClose) {
            onClose();
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setMessage({ type: "error", text: `Error: ${error.message || 'Unknown error occurred'}` });
      setLoading(false);
      setSubmitted(false);
    }
  };

  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  if (!exercises || !Array.isArray(exercises)) {
    console.error("Invalid exercises prop:", exercises);
  }

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {editLog && editLog.originalIndex !== undefined
          ? "Edit Workout Log"
          : "Add Workout Log"}
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
          onChange={(e, newValue) => {
            // When muscle group changes, update both muscle group and potentially reset exercise
            const updatedLog = { ...log, muscleGroup: newValue || "" };
            
            // Check if current exercise belongs to the new muscle group
            if (newValue && log.exercise) {
              try {
                const isExerciseValid = (exercises || []).some(
                  e => e.muscleGroup === newValue && e.exercise === log.exercise
                );
                
                if (!isExerciseValid) {
                  // Exercise doesn't belong to this muscle group, reset it
                  updatedLog.exercise = "";
                }
              } catch (err) {
                console.error("Error checking exercise validity:", err);
              }
            }
            
            setLog(updatedLog);
          }}
          freeSolo
          getOptionLabel={(option) => option || ""}
          isOptionEqualToValue={(option, value) => option === value}
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
          onChange={(e, newValue) => {
            // When exercise changes, update both exercise and potentially update muscle group
            const updatedLog = { ...log, exercise: newValue || "" };
            
            // If muscle group is not set but exercise is, try to set the muscle group
            if (newValue && !log.muscleGroup) {
              try {
                const matchingGroups = [...new Set(
                  (exercises || [])
                    .filter(e => e.exercise === newValue)
                    .map(e => e.muscleGroup)
                )];
                
                // If there's exactly one muscle group for this exercise, set it
                if (matchingGroups.length === 1) {
                  updatedLog.muscleGroup = matchingGroups[0];
                }
              } catch (err) {
                console.error("Error finding matching muscle groups:", err);
              }
            }
            
            setLog(updatedLog);
          }}
          freeSolo
          getOptionLabel={(option) => option || ""}
          isOptionEqualToValue={(option, value) => option === value}
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
        <TextField
          label="Rest Time (seconds)"
          type="number"
          value={log.restTime}
          onChange={(e) => setLog({ ...log, restTime: e.target.value })}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, max: 300 }}
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
        <Button onClick={handleClose} color="secondary" disabled={loading}>
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
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    muscleGroup: PropTypes.string,
    exercise: PropTypes.string,
    reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    restTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    exerciseIndex: PropTypes.number,
    setIndex: PropTypes.number,
    originalIndex: PropTypes.number,
  }),
  onSave: PropTypes.func,
};

export default WorkoutLogModal;
