import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { 
  DirectionsRun as TrainIcon, 
  SelfImprovement as RestIcon,
  CloudOff as OfflineIcon,
  Cloud as OnlineIcon
} from '@mui/icons-material';

interface StatusCardProps {
  items: string[];
}

interface SimpleStatusCardProps {
  isOffline: boolean;
}

export const StatusCard: React.FC<SimpleStatusCardProps> = React.memo(({ isOffline }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        height: '100%',
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
        {isOffline ? (
          <OfflineIcon 
            sx={{ 
              mr: 1, 
              color: theme.palette.error.main 
            }} 
          />
        ) : (
          <OnlineIcon 
            sx={{ 
              mr: 1, 
              color: theme.palette.success.main 
            }} 
          />
        )}
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Current Status
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1
        }}
      >
        {isOffline ? (
          <Typography color="error.main">
            Offline Mode
          </Typography>
        ) : (
          <Typography color="success.main">
            Online - Synced
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

export const TrainMusclesCard: React.FC<StatusCardProps> = React.memo(({ items }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        height: '100%',
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1
        }}
      >
        {items && items.length > 0 ? (
          <Typography>
            {items.join(', ')}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            No muscles ready to train
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

export const RestMusclesCard: React.FC<StatusCardProps> = React.memo(({ items }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        height: '100%',
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
            color: theme.palette.info.main 
          }} 
        />
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Rest
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1
        }}
      >
        {items && items.length > 0 ? (
          <Typography>
            {items.join(', ')}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            No muscles need rest
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

// Add display names for debugging
StatusCard.displayName = 'StatusCard';
TrainMusclesCard.displayName = 'TrainMusclesCard';
RestMusclesCard.displayName = 'RestMusclesCard';