import React, { useState, memo, useCallback } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  LinearProgress,
  Divider,
  Grid
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Check as CheckIcon } from "@mui/icons-material";
import { LogEntry } from "../types";

interface Goal {
  exercise: string;
  targetWeight: number;
  current: number;
}

interface ProgressGoalsProps {
  logs: LogEntry[];
}

const ProgressGoals: React.FC<ProgressGoalsProps> = ({ logs }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<{exercise: string; targetWeight: string}>({ 
    exercise: "", 
    targetWeight: "" 
  });

  // Calculate the current max for a given exercise
  const getCurrentMax = useCallback((exercise: string): number => {
    if (!logs || logs.length === 0) return 0;
    
    const relevantLogs = logs.filter((log) => log[2] === exercise);
    if (relevantLogs.length === 0) return 0;
    
    return Math.max(...relevantLogs.map((log) => {
      const weight = typeof log[4] === 'string' ? parseFloat(log[4]) : log[4];
      return isNaN(weight) ? 0 : weight;
    }), 0);
  }, [logs]);

  // Handle input changes for the new goal
  const handleExerciseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal(prev => ({ ...prev, exercise: e.target.value }));
  }, []);

  const handleTargetWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal(prev => ({ ...prev, targetWeight: e.target.value }));
  }, []);

  // Add a new goal
  const handleAddGoal = useCallback(() => {
    if (!newGoal.exercise || !newGoal.targetWeight) return;
    
    const targetWeight = parseFloat(newGoal.targetWeight);
    if (isNaN(targetWeight)) return;
    
    const current = getCurrentMax(newGoal.exercise);
    
    setGoals(prevGoals => [
      ...prevGoals,
      { 
        exercise: newGoal.exercise, 
        targetWeight, 
        current
      }
    ]);
    
    setNewGoal({ exercise: "", targetWeight: "" });
  }, [newGoal, getCurrentMax]);

  // Delete a goal
  const handleDeleteGoal = useCallback((index: number) => {
    setGoals(prevGoals => prevGoals.filter((_, i) => i !== index));
  }, []);

  // Update progress for all goals based on latest logs
  const updateProgress = useCallback(() => {
    setGoals(prevGoals => 
      prevGoals.map(goal => ({
        ...goal,
        current: getCurrentMax(goal.exercise)
      }))
    );
  }, [getCurrentMax]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: (theme) => 
          theme.palette.mode === 'dark' 
            ? '0 3px 10px rgba(0,0,0,0.5)' 
            : '0 3px 10px rgba(0,0,0,0.1)',
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Progress Goals
      </Typography>
      
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={5}>
          <TextField
            label="Exercise"
            variant="outlined"
            fullWidth
            size="small"
            value={newGoal.exercise}
            onChange={handleExerciseChange}
            placeholder="e.g. Bench Press"
          />
        </Grid>
        <Grid item xs={8} sm={5}>
          <TextField
            label="Target Weight (kg)"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            value={newGoal.targetWeight}
            onChange={handleTargetWeightChange}
            placeholder="e.g. 100"
            InputProps={{
              inputProps: { min: 0, step: 2.5 }
            }}
          />
        </Grid>
        <Grid item xs={4} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddGoal}
            disabled={!newGoal.exercise || !newGoal.targetWeight}
            startIcon={<AddIcon />}
            fullWidth
            sx={{ height: '40px' }}
          >
            Add
          </Button>
        </Grid>
      </Grid>

      {goals.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={updateProgress}
            startIcon={<CheckIcon />}
          >
            Update Progress
          </Button>
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List disablePadding>
          {goals.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Add your first goal to track progress
              </Typography>
            </Box>
          ) : goals.map((goal, i) => {
            const progress = (goal.current / goal.targetWeight) * 100;
            const isCompleted = progress >= 100;
            
            return (
              <React.Fragment key={i}>
                {i > 0 && <Divider />}
                <ListItem 
                  disableGutters
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => handleDeleteGoal(i)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {goal.exercise}: {goal.current}kg / {goal.targetWeight}kg
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color={isCompleted ? "success.main" : "text.secondary"}>
                            {progress.toFixed(1)}%
                          </Typography>
                          {isCompleted && (
                            <Typography variant="body2" color="success.main">
                              Completed!
                            </Typography>
                          )}
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(progress, 100)} 
                          color={isCompleted ? "success" : "primary"}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};

export default memo(ProgressGoals);