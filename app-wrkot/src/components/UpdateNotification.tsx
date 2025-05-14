import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function UpdateNotification() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent) => {
      // The updateSW function was set in main.tsx when registering the service worker
      console.log('Update available!');
      setNeedRefresh(true);
    };

    // Listen for the custom event from the service worker
    window.addEventListener('pwa-update-available', handleUpdateAvailable as EventListener);
    
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    if (window.updateSW) {
      window.updateSW(true).then(() => {
        setNeedRefresh(false);
      });
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-xs p-4 bg-background border border-border rounded-lg shadow-lg z-50">
      <div className="flex flex-col gap-3">
        <h3 className="font-medium">Update Available</h3>
        <p className="text-sm text-muted-foreground">
          A new version of this application is available.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setNeedRefresh(false)}>
            Later
          </Button>
          <Button onClick={handleUpdate}>
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
}
