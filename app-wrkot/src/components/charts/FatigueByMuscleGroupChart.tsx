import React from 'react';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Bar,
  Tooltip, Legend
} from 'recharts';
import { processRecentFatigueByMuscleGroupData } from './ChartDataProcessing';
import { CHART_COLORS, TOOLTIP_STYLE } from './ChartConfig';
import './ChartStyles.css';

interface ChartComponentProps {
  logs: WorkoutLogEntry[];
}

export const RecentFatigueByMuscleGroupBarChart: React.FC<ChartComponentProps> = ({ logs }) => {
  const data = processRecentFatigueByMuscleGroupData(logs, 7);
  if (data.length === 0) {    return (
      <Card className="chart-card">        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Fatigue By Muscle Group</CardTitle><CardDescription className="text-xs">No data available.</CardDescription></CardHeader>
        <CardContent className="pt-0"><div className="chart-container flex items-center justify-center"><p className="text-muted-foreground text-sm">Log workouts to see recent fatigue by muscle group.</p></div></CardContent>
      </Card>
    );
  }
  
  return (    <Card className="chart-card">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Fatigue By Muscle Group (Last 7 Days)</CardTitle><CardDescription className="text-xs">Recent volume for muscle group as % of your peak single-day total volume.</CardDescription></CardHeader>      <CardContent className="pt-0">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="fatigueBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={CHART_COLORS.recentFatigue} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={CHART_COLORS.recentFatigue} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis type="number" domain={[0, 'dataMax + 10']} unit="%" tickLine={false} axisLine={false} />
              <YAxis dataKey="muscleGroup" type="category" width={120} interval={0} tickLine={false} axisLine={false} dx={-5}/>              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend 
                wrapperStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
                )}
              />
              <Bar 
                dataKey="fatiguePercent" 
                name="Fatigue" 
                fill="url(#fatigueBarGradient)" 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
