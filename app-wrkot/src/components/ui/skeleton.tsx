import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shape?: "rect" | "circle" | "rounded";
  pulse?: boolean;
  variant?: "default" | "subtle";
}

export function Skeleton({
  className,
  shape = "rect",
  pulse = true,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse",
        {
          "rounded-md": shape === "rect",
          "rounded-full": shape === "circle",
          "rounded-lg": shape === "rounded",
          "bg-muted/70": variant === "default",
          "bg-muted/30": variant === "subtle",
        },
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/30 bg-card/50 backdrop-blur-md p-6 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-4 w-24" variant="subtle" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" variant="subtle" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2" variant="subtle" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
