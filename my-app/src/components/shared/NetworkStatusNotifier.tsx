import React, { useState, useEffect } from 'react';
import { Snackbar, Box, Typography, useTheme } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';

/**
 * NetworkStatusNotifier Component
 * 
 * Displays a notification when the network connection status changes
 * Shows a "You're offline" notification when the connection is lost
 * Shows a "Back online" notification when the connection is restored
 */
const NetworkStatusNotifier: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState<boolean>(false);
  const [showOnlineNotice, setShowOnlineNotice] = useState<boolean>(false);
  const theme = useTheme();
  
  useEffect(() => {
    // Function to handle online status change
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineNotice(true);
      
      // Hide the online notice after 3 seconds
      setTimeout(() => {
        setShowOnlineNotice(false);
      }, 3000);
    };
    
    // Function to handle offline status change
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <>
      {/* Offline notification */}
      <Snackbar
        open={showOfflineNotice && !isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.error.dark,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '250px',
            maxWidth: '90%',
          }
        }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
            <WifiOffIcon sx={{ mr: 1.5 }} />
            <Typography variant="body1">You're offline</Typography>
          </Box>
        }
      />
      
      {/* Back online notification */}
      <Snackbar
        open={showOnlineNotice && isOnline}
        autoHideDuration={3000}
        onClose={() => setShowOnlineNotice(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.success.dark,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '250px',
            maxWidth: '90%',
          }
        }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
            <NetworkCheckIcon sx={{ mr: 1.5 }} />
            <Typography variant="body1">Back online</Typography>
          </Box>
        }
      />
    </>
  );
};

export default NetworkStatusNotifier;