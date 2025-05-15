import React from 'react';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Bar,
  Tooltip, Legend
} from 'recharts';
import { processVolumeByMuscleGroupData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const VolumeByMuscleGroupBarChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processVolumeByMuscleGroupData(logs);
  if (data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Volume by Muscle Group</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see volume distribution.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Total Volume by Muscle Group</CardTitle><CardDescription className="text-xs">Total volume lifted per muscle group (all time).</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="volumeBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={CHART_COLORS.volume} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={CHART_COLORS.volume} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis 
                type="number" 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`}
              />
              <YAxis 
                dataKey="muscleGroup" 
                type="category" 
                width={100} 
                interval={0} 
                tickLine={false} 
                axisLine={false} 
                dx={-5} 
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
              <Bar 
                dataKey="totalVolume" 
                name="Total Volume" 
                fill="url(#volumeBarGradient)" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
