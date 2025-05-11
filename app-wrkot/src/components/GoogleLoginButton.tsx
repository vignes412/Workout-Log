import React from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';

interface GoogleLoginButtonProps {
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ className = '' }) => {
  const { login, authLoading } = useAppStore();

  return (
    <Button
      variant="outline"
      className={`flex items-center justify-center ${className}`}
      onClick={login}
      disabled={authLoading}
    >
      {authLoading ? (
        <span className="mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></span>
      ) : (
        <div></div>
      )}
      {authLoading ? 'Connecting...' : 'Sign in with Google'}
    </Button>
  );
};
