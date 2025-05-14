import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Sample data structure
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any; // Allow for additional properties
}

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, className, children }: ChartCardProps) {
  return (
    <Card
      variant="glass"
      hover="lift"
      className={cn("overflow-hidden", className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  lineColor?: string;
  strokeWidth?: number;
  animate?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  dataKey?: string;
  className?: string;
}

export function AnimatedLineChart({
  data,
  height = 300,
  lineColor = "hsl(var(--primary))",
  strokeWidth = 2,
  animate = true,
  showGrid = true,
  showAxis = true,
  dataKey = "value",
  className,
}: LineChartProps) {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showAxis && (
            <>
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          {showGrid && (
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          )}
          <Tooltip 
            contentStyle={{ 
              background: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            cursor={false}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: lineColor, strokeWidth: 0 }}
            isAnimationActive={animate}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  data: ChartData[];
  height?: number;
  barColor?: string;
  animate?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  dataKey?: string;
  className?: string;
  useGradient?: boolean;
}

export function AnimatedBarChart({
  data,
  height = 300,
  barColor = "hsl(var(--primary))",
  animate = true,
  showGrid = true,
  showAxis = true,
  dataKey = "value",
  className,
  useGradient = false,
}: BarChartProps) {
  const gradientId = `barGradient-${Math.random().toString(36).substring(7)}`;
  
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {useGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={1} />
              </linearGradient>
            </defs>
          )}
          {showAxis && (
            <>
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          {showGrid && (
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          )}
          <Tooltip 
            contentStyle={{ 
              background: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            cursor={{ fill: 'hsl(var(--muted)/30)' }}
          />
          <Bar
            dataKey={dataKey}
            fill={useGradient ? `url(#${gradientId})` : barColor}
            radius={[4, 4, 0, 0]}
            isAnimationActive={animate}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Example for a workout progress chart component
export function WorkoutProgressChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard 
      title="Workout Progress" 
      description="Your performance over the last 30 days"
    >
      <AnimatedLineChart 
        data={data}
        height={300}
        lineColor="hsl(var(--primary))"
      />
    </ChartCard>
  );
}

// Example for a weight lifted chart component
export function WeightLiftedChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard 
      title="Weight Lifted" 
      description="Total weight by workout (kg)"
    >
      <AnimatedBarChart 
        data={data}
        height={300}
        useGradient
      />
    </ChartCard>
  );
}
