import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  blur?: 'none' | 'sm' | 'md' | 'lg';
}

const getBlurClass = (blur: 'none' | 'sm' | 'md' | 'lg') => {
  switch (blur) {
    case 'none':
      return '';
    case 'sm':
      return 'backdrop-blur-sm';
    case 'lg':
      return 'backdrop-blur-lg';
    case 'md':
    default:
      return 'backdrop-blur-md';
  }
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hover = true,
  gradient = false,
  blur = 'md',
  ...props
}) => {
  const blurClass = getBlurClass(blur);
  
  return (
    <motion.div
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-lg border border-border/30 bg-card/50",
        blurClass,
        gradient ? "bg-gradient-to-br from-background/70 to-background/50" : "",
        "shadow-sm transition-all duration-300",
        hover && "hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Variant with a more pronounced glass effect and accent border
export const AccentGlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hover = true,
  blur = 'md',
  ...props
}) => {
  const blurClass = getBlurClass(blur);
  
  return (
    <motion.div
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-lg bg-gradient-to-br from-background/60 to-background/40",
        "border border-primary/20 shadow-sm",
        blurClass,
        "transition-all duration-300",
        "relative overflow-hidden",
        hover && "hover:shadow-md hover:border-primary/30",
        className
      )}
      {...props}
    >
      {/* Glossy accent effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
      
      {children}
    </motion.div>
  );
};

// Gradient background card with text content
export const GradientCard: React.FC<GlassCardProps & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}> = ({
  children,
  className,
  title,
  description,
  icon,
  hover = true,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-lg bg-gradient-to-br from-primary/80 to-accent/80",
        "border border-primary/20 shadow-md text-white",
        "transition-all duration-300",
        hover && "hover:shadow-lg",
        className
      )}
      {...props}
    >
      <div className="p-6 flex flex-col gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        )}
        {title && <h3 className="text-xl font-semibold">{title}</h3>}
        {description && <p className="text-white/80">{description}</p>}
        {children}
      </div>
    </motion.div>
  );
};
