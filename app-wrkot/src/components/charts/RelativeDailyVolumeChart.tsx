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
import { processRelativeDailyVolumeData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const RelativeDailyVolumeLineChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processRelativeDailyVolumeData(logs);
  if (data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Relative Daily Volume</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see daily volume trends.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Relative Daily Volume (Fatigue Proxy)</CardTitle><CardDescription className="text-xs">Daily volume as a percentage of your max recorded daily volume.</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRelativeVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.relativeVolume} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.relativeVolume} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'MMM d')} tickLine={false} axisLine={false} dy={5}/>
              <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} dx={-5}/>              <Tooltip 
                formatter={(value: number) => `${value}%`}
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
                name="Relative Volume"
                dataKey="relativeVolume" 
                stroke={CHART_COLORS.relativeVolume} 
                strokeWidth={2}
                fillOpacity={0.8}
                fill="url(#colorRelativeVolume)"
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
