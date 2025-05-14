import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

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
}: StatCardProps) => {
  return (
    <Card 
      variant="glass"
      hover="lift"
      className={cn("overflow-hidden", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">{title}</CardTitle>
        {icon && (
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
            <div className="h-4 w-4 sm:h-5 sm:w-5">{icon}</div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{description}</p>
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
            {trend.isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trend.value}%
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
};
