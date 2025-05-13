import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FloatingActionButtonProps extends React.ComponentProps<"button"> {
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export function FloatingActionButton({ 
  className, 
  icon, 
  tooltip,
  ...props 
}: FloatingActionButtonProps) {  const button = (
    <Button
      className={cn(
        "fixed bottom-20 right-5 md:bottom-8 md:right-8 rounded-full shadow-lg w-14 h-14 p-0 z-50 transition-all hover:scale-110 hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      size="icon"
      {...props}
    >
      <div className="relative inline-flex items-center justify-center">
        {icon}
        <span className="absolute w-full h-full rounded-full animate-ping bg-primary/40 inset-0"></span>
      </div>
      <span className="sr-only">{tooltip || "Action button"}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
