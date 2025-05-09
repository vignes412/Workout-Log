import React from 'react';
import {
  Box,
  Badge,
  Chip,
  Typography,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  SignalWifiBad as OfflineIcon,
  SignalWifi4Bar as OnlineIcon,
  FitnessCenter as TrainIcon,
  BatteryFull as ChargedIcon,
  AccessTime as RestIcon
} from '@mui/icons-material';

interface StatusCardProps {
  isOffline: boolean;
  logsCount: number;
}

interface TrainMusclesCardProps {
  readyToTrain: string[];
}

interface RestMusclesCardProps {
  restMuscles: string[];
}

export const StatusCard: React.FC<StatusCardProps> = ({ isOffline, logsCount }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 2.5,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              bgcolor: isOffline ? theme.palette.error.main : theme.palette.success.main,
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: `2px solid ${theme.palette.background.paper}`,
            }}
          />
        }
      >
        {isOffline ? (
          <OfflineIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />
        ) : (
          <OnlineIcon sx={{ fontSize: 48, color: theme.palette.success.main }} />
        )}
      </Badge>
      
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 1,
          fontWeight: 600,
          color: theme.palette.text.primary
        }}
      >
        {isOffline ? 'Offline Mode' : 'Online Mode'}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: theme.palette.text.secondary,
          mb: 1.5
        }}
      >
        {isOffline
          ? 'Changes will sync when online'
          : 'Connected to cloud storage'}
      </Typography>
      
      <Chip 
        label={`${logsCount} Total Logs`}
        sx={{ 
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          fontWeight: 'medium'
        }}
      />
    </Paper>
  );
};

export const TrainMusclesCard: React.FC<TrainMusclesCardProps> = ({ readyToTrain }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1.5
        }}
      >
        <TrainIcon 
          sx={{ 
            mr: 1, 
            color: theme.palette.success.main 
          }} 
        />
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Ready to Train
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.75,
          flex: 1,
          overflowY: 'auto',
          py: 0.5
        }}
      >
        {readyToTrain.length === 0 ? (
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
              py: 1
            }}
          >
            No muscle groups ready to train
          </Typography>
        ) : (
          readyToTrain.map((muscle) => (
            <Chip
              key={muscle}
              label={muscle}
              size="small"
              icon={<ChargedIcon />}
              sx={{ 
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: theme.palette.success.main
                }
              }}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

export const RestMusclesCard: React.FC<RestMusclesCardProps> = ({ restMuscles }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1.5
        }}
      >
        <RestIcon 
          sx={{ 
            mr: 1, 
            color: theme.palette.warning.main 
          }} 
        />
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Needs Rest
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.75,
          flex: 1,
          overflowY: 'auto',
          py: 0.5
        }}
      >
        {restMuscles.length === 0 ? (
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
              py: 1
            }}
          >
            All muscle groups are ready
          </Typography>
        ) : (
          restMuscles.map((muscle) => (
            <Chip
              key={muscle}
              label={muscle}
              size="small"
              icon={<RestIcon />}
              sx={{ 
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: theme.palette.warning.main
                }
              }}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};