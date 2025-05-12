import React, { useState } from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if online or if the user dismissed the notification
  if (isOnline || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-yellow-500 text-black px-4 py-2 flex justify-between items-center">
      <p className="text-center font-medium flex-1">
        You are currently offline. Some features may be limited.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 bg-transparent border-none text-black hover:text-gray-800"
        aria-label="Dismiss offline notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
