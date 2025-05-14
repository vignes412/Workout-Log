import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UpdateIcon from '@mui/icons-material/Update';
import * as serviceWorkerRegistration from '../../serviceWorkerRegistration';

/**
 * UpdateNotification Component
 * 
 * Displays a notification when a new version of the app is available
 * and provides a button to update to the new version.
 */
const UpdateNotification: React.FC = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Listen for service worker updates
    const handleServiceWorkerUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: string;
        registration?: ServiceWorkerRegistration;
      }>;

      if (customEvent.detail?.type === 'update' || customEvent.detail?.type === 'waiting') {
        setShowReload(true);
        if (customEvent.detail.registration?.waiting) {
          setWaitingWorker(customEvent.detail.registration.waiting);
        }
      }
    };

    window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);
    };
  }, []);

  // Reload the page to use the new version
  const reloadPage = () => {
    if (waitingWorker) {
      // Tell the service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // If there's no direct reference to the worker, use the helper
      serviceWorkerRegistration.skipWaiting();
    }
    
    setShowReload(false);
    
    // The controlling event should trigger a reload automatically,
    // but let's add a fallback just in case
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Snackbar
      open={showReload}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiPaper-root': {
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '300px',
        }
      }}
      message={
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
          <UpdateIcon sx={{ mr: 1.5, color: '#63b3ed' }} />
          <Typography variant="body1">New version available!</Typography>
        </Box>
      }
      action={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="primary" 
            size="small" 
            onClick={reloadPage}
            sx={{ 
              mr: 1, 
              backgroundColor: '#63b3ed', 
              color: 'white',
              '&:hover': {
                backgroundColor: '#4299e1',
              }, 
            }}
          >
            UPDATE
          </Button>
          <Button 
            size="small" 
            color="inherit" 
            onClick={() => setShowReload(false)}
            sx={{ color: '#a0aec0' }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      }
    />
  );
};

export default UpdateNotification;