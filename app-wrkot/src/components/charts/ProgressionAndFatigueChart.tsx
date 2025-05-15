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
import { processProgressionAndFatigueData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const ProgressionAndFatigueLineChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processProgressionAndFatigueData(logs);
  if (!data || data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Progression & Fatigue Over Time</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see progression and fatigue trends.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Progression & Fatigue Over Time</CardTitle><CardDescription className="text-xs">Daily progression rate and fatigue levels.</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorProgression" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.progression} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.progression} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFatigue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.fatigue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.fatigue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'MMM d')} tickLine={false} axisLine={false} dy={5}/>
              <YAxis yAxisId="left" orientation="left" unit="%" tickLine={false} axisLine={false} dx={-5} stroke={CHART_COLORS.progression} />
              <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tickLine={false} axisLine={false} dx={-5} stroke={CHART_COLORS.fatigue}/>              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'progression') {
                    return [`${value.toFixed(2)}% (Progression)`, name];
                  }
                  if (name === 'fatigue') {
                    return [`${value.toFixed(2)}% (Fatigue)`, name];
                  }
                  return [`${value.toFixed(2)}%`, name];
                }}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend 
                wrapperStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
                )}
              />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="progression" 
                name="Progression" 
                strokeWidth={2} 
                stroke={CHART_COLORS.progression} 
                fillOpacity={0.6}
                fill="url(#colorProgression)"
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="fatigue" 
                name="Fatigue" 
                strokeWidth={2} 
                stroke={CHART_COLORS.fatigue} 
                fillOpacity={0.6}
                fill="url(#colorFatigue)"
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
