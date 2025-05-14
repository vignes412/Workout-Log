import React, { useEffect, useState } from 'react';
import { Snackbar, Button, Typography, Box } from '@mui/material';

interface UpdateNotificationProps {
  onRefresh?: () => void;
  message?: string;
  acceptText?: string;
  declineText?: string;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onRefresh = () => window.location.reload(),
  message = 'A new version is available. Update now?',
  acceptText = 'Update',
  declineText = 'Later'
}) => {
  const [open, setOpen] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Listen for the custom 'serviceWorkerUpdate' event
    const handleServiceWorkerUpdate = (event: CustomEvent) => {
      const newRegistration = event.detail;
      setRegistration(newRegistration);
      setOpen(true);
    };

    // Add event listener with type assertion for CustomEvent
    window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate as EventListener);

    return () => {
      window.removeEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate as EventListener);
    };
  }, []);

  const handleRefresh = () => {
    setOpen(false);
    // If waiting service worker exists, tell it to skip waiting
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Call the onRefresh callback (which defaults to window.location.reload())
    onRefresh();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, sm: 30 } }} // Adjust for mobile bottom navigation if present
    >
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 1, 
        p: 2, 
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Typography variant="body1">{message}</Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button size="small" onClick={handleClose} color="inherit">
            {declineText}
          </Button>
          <Button size="small" onClick={handleRefresh} variant="contained" color="primary">
            {acceptText}
          </Button>
        </Box>
      </Box>
    </Snackbar>
  );
};

export default UpdateNotification;