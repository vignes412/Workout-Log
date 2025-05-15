import React from 'react';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart,
  ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, Legend
} from 'recharts';
import { processMuscleGroupVolumeDistributionData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const MuscleGroupVolumeDistributionRadarChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processMuscleGroupVolumeDistributionData(logs);
  if (data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Muscle Group Volume Distribution</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see volume distribution.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Muscle Group Volume Distribution</CardTitle><CardDescription className="text-xs">Percentage of total volume per muscle group (all time).</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>              <defs>
                <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor={CHART_COLORS.distribution} stopOpacity={0.9} />
                  <stop offset="80%" stopColor={CHART_COLORS.distribution} stopOpacity={0.7} />
                </radialGradient>
              </defs><PolarGrid gridType="circle" stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.3} />
              <PolarAngleAxis 
                dataKey="subject" 
                tickLine={false} 
                axisLine={false} 
                tick={{ 
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))'
                }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tickLine={false} 
                axisLine={false} 
                tick={{ 
                  fontSize: 11,
                  fill: 'hsl(var(--muted-foreground))'
                }} 
              /><Tooltip 
                formatter={(value: number) => `${value}%`}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend 
                wrapperStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
                )}
              />              <Radar 
                dataKey="value" 
                name="Distribution" 
                fill="url(#radarGradient)" 
                fillOpacity={0.85} 
                stroke={CHART_COLORS.distribution} 
                strokeWidth={2.5}
                strokeOpacity={0.9}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
