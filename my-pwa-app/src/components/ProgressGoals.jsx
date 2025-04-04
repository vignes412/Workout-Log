import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const ProgressGoals = ({ logs }) => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ exercise: "", targetWeight: "" });

  const getCurrentMax = (exercise) => {
    const relevantLogs = logs.filter((log) => log.exercise === exercise);
    return Math.max(...relevantLogs.map((log) => log.weight), 0);
  };

  const handleAddGoal = () => {
    if (!newGoal.exercise || !newGoal.targetWeight) return;
    setGoals([
      ...goals,
      { ...newGoal, current: getCurrentMax(newGoal.exercise) },
    ]);
    setNewGoal({ exercise: "", targetWeight: "" });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Exercise"
          value={newGoal.exercise}
          onChange={(e) => setNewGoal({ ...newGoal, exercise: e.target.value })}
        />
        <TextField
          label="Target Weight (kg)"
          type="number"
          value={newGoal.targetWeight}
          onChange={(e) =>
            setNewGoal({ ...newGoal, targetWeight: e.target.value })
          }
        />
        <Button variant="contained" onClick={handleAddGoal}>
          Add Goal
        </Button>
      </Box>
      <List>
        {goals.map((goal, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={`${goal.exercise}: Current ${goal.current}kg / Target ${goal.targetWeight}kg`}
              secondary={`Progress: ${(
                (goal.current / goal.targetWeight) *
                100
              ).toFixed(1)}%`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ProgressGoals;
