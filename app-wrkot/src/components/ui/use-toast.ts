// Simplified toast hook
import { useState } from 'react';

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    setToasts((prevToasts) => [...prevToasts, props]);
    
    // Simple implementation - just show an alert
    alert(`${props.title}${props.description ? '\n' + props.description : ''}`);
    
    // In a real implementation, you'd add the toast to a list and render it in the UI
  };

  return {
    toast,
    toasts
  };
}
