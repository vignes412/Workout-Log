import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Grid,
  Button,
  Collapse,
  TextField,
  Tooltip
} from '@mui/material';
import {
  FitnessCenter,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Edit,
  Save,
  Check,
  Add
} from '@mui/icons-material';
import { WorkoutExercise } from '../types';
import { formatTime } from '../utils/helpers';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isActive?: boolean;
  onSetComplete: (exerciseIndex: number, setIndex: number) => void;
  onAddExtraSet: (exerciseIndex: number) => void;
  onEditNotes: (exercise: WorkoutExercise) => void;
  onRestTimer: (exercise: WorkoutExercise, index: number) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = React.memo(({
  exercise,
  index,
  isActive = false,
  onSetComplete,
  onAddExtraSet,
  onEditNotes,
  onRestTimer
}) => {
  const [expanded, setExpanded] = useState<boolean>(isActive);

  // Calculate progress percentage for this exercise
  const progressPercentage = useMemo(() => {
    const completed = exercise.setsCompleted || 0;
    return exercise.sets ? Math.round((completed / exercise.sets) * 100) : 0;
  }, [exercise.sets, exercise.setsCompleted]);

  // Generate buttons for sets
  const setButtons = useMemo(() => {
    const buttons = [];
    const completedSets = exercise.setsCompleted || 0;
    
    for (let i = 0; i < exercise.sets; i++) {
      const isCompleted = i < completedSets;
      buttons.push(
        <Button
          key={i}
          variant={isCompleted ? "contained" : "outlined"}
          color={isCompleted ? "success" : "primary"}
          size="small"
          sx={{ m: 0.5, minWidth: '36px' }}
          onClick={() => onSetComplete(index, i)}
          startIcon={isCompleted ? <Check /> : null}
        >
          {i + 1}
        </Button>
      );
    }
    return buttons;
  }, [exercise.sets, exercise.setsCompleted, index, onSetComplete]);

  return (
    <Card sx={{ mb: 2 }} id={`exercise-${index}`}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FitnessCenter sx={{ mr: 1 }} />
          <Typography variant="h6">
            {exercise.exercise || "Unnamed Exercise"}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip 
            label={`${exercise.setsCompleted || 0}/${exercise.sets} sets`} 
            color={progressPercentage === 100 ? "success" : "primary"}
            size="small"
            sx={{ mr: 1 }}
          />
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {exercise.muscleGroup} • {exercise.reps} reps {exercise.weight ? `• ${exercise.weight} lbs` : ''}
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 6, borderRadius: 3, mb: 1 }} 
        />
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Workout Sets:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {setButtons}
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                sx={{ m: 0.5 }}
                onClick={() => onAddExtraSet(index)}
                startIcon={<Add />}
              >
                Add Set
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                size="small"
                startIcon={<AccessTime />}
                variant="outlined"
                onClick={() => onRestTimer(exercise, index)}
              >
                Rest Timer: {formatTime(exercise.restBetweenSets || 60)}
              </Button>
              
              <Button
                size="small"
                startIcon={<Edit />}
                variant="outlined"
                onClick={() => onEditNotes(exercise)}
              >
                Notes
              </Button>
            </Box>
            
            {exercise.notes && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {exercise.notes}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

export default ExerciseCard;