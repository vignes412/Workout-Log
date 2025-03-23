import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

const WorkoutLogModal = ({ open, onClose, onSave }) => {
  const [date, setDate] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [exercise, setExercise] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [howIFeel, setHowIFeel] = useState(""); // Replaced rating with howIFeel

  const handleSave = () => {
    onSave([date, muscleGroup, exercise, reps, weight, howIFeel]);
    setDate("");
    setMuscleGroup("");
    setExercise("");
    setReps("");
    setWeight("");
    setHowIFeel("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Workout Log</DialogTitle>
      <DialogContent>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Muscle Group"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Reps"
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Weight"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          select
          label="How I Feel"
          value={howIFeel}
          onChange={(e) => setHowIFeel(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Easy">Easy</MenuItem>
          <MenuItem value="Moderate">Moderate</MenuItem>
          <MenuItem value="Hard">Hard</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkoutLogModal;
