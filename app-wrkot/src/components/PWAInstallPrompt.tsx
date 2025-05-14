import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { pwaConfig } from '../config/pwa.config';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the installation');
    } else {
      console.log('User dismissed the installation');
    }

    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null);
  };

  // Don't show the install button if already installed or no prompt is available
  if (isInstalled || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md p-4 bg-background border border-border rounded-lg shadow-lg z-50">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8v8"></path><path d="M8 8v8"></path><path d="M12 4v16"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium">{pwaConfig.installation.installButtonText}</h3>
              <p className="text-sm text-muted-foreground">{pwaConfig.installation.installDescription}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setInstallPrompt(null)}>
            Not now
          </Button>
          <Button onClick={handleInstallClick}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
