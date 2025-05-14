import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress, 
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { 
  Pause, 
  PlayArrow, 
  Replay, 
  Close,
  Add,
  Remove
} from '@mui/icons-material';
import { formatTime } from '../utils/helpers';

interface RestTimerProps {
  initialTime: number;
  onComplete?: () => void;
  onClose?: () => void;
  canAdjustTime?: boolean;
}

const RestTimer: React.FC<RestTimerProps> = React.memo(({
  initialTime = 60,
  onComplete,
  onClose,
  canAdjustTime = true
}) => {
  const [time, setTime] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(100);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(initialTime);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Reset timer if initialTime changes
  useEffect(() => {
    setTime(initialTime);
    startTimeRef.current = initialTime;
    setProgress(100);
  }, [initialTime]);

  // Start/pause timer
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      // Pause timer
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start timer
      intervalRef.current = window.setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            // Timer complete
            if (intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          
          // Update progress
          const newTime = prevTime - 1;
          const newProgress = (newTime / startTimeRef.current) * 100;
          setProgress(newProgress);
          
          return newTime;
        });
      }, 1000);
    }
    
    setIsRunning(!isRunning);
  }, [isRunning, onComplete]);

  // Reset timer
  const resetTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTime(startTimeRef.current);
    setProgress(100);
    setIsRunning(false);
  }, []);

  // Adjust timer
  const adjustTimer = useCallback((seconds: number) => {
    const newTime = Math.max(0, time + seconds);
    setTime(newTime);
    startTimeRef.current = newTime;
    setProgress(100);
  }, [time]);

  // Auto-start timer when mounted
  useEffect(() => {
    toggleTimer();
  }, []);

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        {onClose && (
          <IconButton 
            size="small" 
            sx={{ position: 'absolute', top: 8, right: 8 }}
            onClick={onClose}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
        
        <Typography variant="h6" align="center" gutterBottom>
          Rest Timer
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <Typography variant="h3" sx={{ fontFamily: 'monospace' }}>
            {formatTime(time)}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={progress < 30 ? "error" : "primary"}
          sx={{ height: 8, borderRadius: 4, mb: 2 }} 
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Button 
            variant="contained" 
            color={isRunning ? "warning" : "success"}
            onClick={toggleTimer}
            startIcon={isRunning ? <Pause /> : <PlayArrow />}
          >
            {isRunning ? "Pause" : "Start"}
          </Button>
          
          <Button 
            variant="outlined"
            onClick={resetTimer}
            startIcon={<Replay />}
          >
            Reset
          </Button>
        </Box>
        
        {canAdjustTime && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => adjustTimer(-15)}
              startIcon={<Remove />}
            >
              15s
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => adjustTimer(-5)}
              startIcon={<Remove />}
            >
              5s
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => adjustTimer(5)}
              startIcon={<Add />}
            >
              5s
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => adjustTimer(15)}
              startIcon={<Add />}
            >
              15s
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default RestTimer;