import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) => {  return (
    <Card 
      variant="glass"
      hover="lift"
      className={cn("overflow-hidden", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
            <div className="h-5 w-5">{icon}</div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        )}
      </CardContent>
      {trend && (
        <CardFooter className="p-2 pt-0">
          <Badge 
            variant={trend.isPositive ? "success" : "destructive"} 
            className={cn(
              "text-xs font-medium gap-1 shadow-sm animate-fade-in py-1", 
              trend.isPositive ? "bg-success/20 text-success hover:bg-success/30" : "bg-destructive/20 text-destructive hover:bg-destructive/30"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={cn(
                "w-3 h-3",
                trend.isPositive ? "rotate-0" : "rotate-180"
              )}
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                clipRule="evenodd"
              />
            </svg>
            {trend.value}% {trend.isPositive ? 'increase' : 'decrease'}
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
};
