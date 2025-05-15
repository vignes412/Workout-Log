import React from 'react';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  AreaChart,
  ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Area,
  Tooltip, Legend
} from 'recharts';
import { processVolumeOverTimeData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const VolumeOverTimeLineChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processVolumeOverTimeData(logs);
  if (data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Total Volume Over Time</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see volume progression.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Total Volume Over Time</CardTitle><CardDescription className="text-xs">Total volume (Weight × Reps) lifted per day.</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 
              margin={{ left: 0, right: 10, top: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorTotalVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.volume} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.volume} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => format(new Date(str), 'MMM d')} 
                tickLine={false} 
                axisLine={false} 
                dy={5}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                dx={-5} 
                tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`}
                tick={{ fontSize: 12 }}
              />              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} kg`}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend 
                wrapperStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
                )}
              />
              <Area 
                type="monotone" 
                dataKey="totalVolume"
                name="Total Volume"
                stroke={CHART_COLORS.volume}
                strokeWidth={2} 
                fillOpacity={0.8}
                fill="url(#colorTotalVolume)"
                activeDot={{ r: 6, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
