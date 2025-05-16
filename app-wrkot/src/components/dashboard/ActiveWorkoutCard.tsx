import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWorkoutTemplateStore } from '@/store/workoutTemplateStore';
import { Clock, CheckCircle, X, PlayCircle, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from '@/lib/utils';

export const ActiveWorkoutCard: React.FC = () => {
  const router = useRouter();
  const { activeWorkout, completeWorkout, cancelWorkout } = useWorkoutTemplateStore();
  
  if (!activeWorkout) {
    return null;
  }
  
  // Calculate overall progress based on completed sets
  const calculateOverallProgress = () => {
    if (!activeWorkout || !activeWorkout.exercises) return 0;
    
    const exercises = activeWorkout.exercises;
    let totalSets = 0;
    let completedSets = 0;
    
    exercises.forEach(exercise => {
      totalSets += exercise.sets;
      completedSets += exercise.setsCompleted || 0;
    });
    
    return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  };
  
  // Format time since workout started
  const formatWorkoutTime = () => {
    const startTime = new Date(activeWorkout.startTime);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    
    return `${minutes}m`;
  };
  
  // Get next exercise that's not completed
  const getNextExercise = () => {
    const nextExercise = activeWorkout.exercises.find(
      ex => (ex.setsCompleted || 0) < ex.sets
    );
    
    return nextExercise;
  };
    // Handle continue workout
  const handleContinueWorkout = () => {
    router.push('/workout');
  };
  
  // Handle complete workout
  const handleCompleteWorkout = async () => {
    const result = await completeWorkout();
    if (result.success) {
      // Could show a notification here
    }
  };
  
  // Handle cancel workout
  const handleCancelWorkout = () => {
    if (window.confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
      cancelWorkout();
    }
  };
  
  const nextExercise = getNextExercise();
  const overallProgress = calculateOverallProgress();
  
  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-all">
      <CardHeader className="bg-secondary/50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center">
            <Dumbbell className="h-5 w-5 mr-2 text-primary" />
            Active Workout
          </CardTitle>
          <Badge variant="outline" className="border-primary text-primary">
            In Progress
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="font-medium text-lg">{activeWorkout.templateName}</h3>
            <div className="text-muted-foreground text-sm">{activeWorkout.description}</div>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Started {formatWorkoutTime()} ago</span>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} />
          </div>
          
          {nextExercise ? (
            <div className="bg-muted p-3 rounded-md border border-border">
              <div className="text-sm font-medium mb-1">Next Exercise:</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{nextExercise.name}</div>
                  <div className="text-xs text-muted-foreground">{nextExercise.sets} sets × {nextExercise.reps} reps</div>
                </div>
                <Badge variant="outline">{nextExercise.muscleGroup}</Badge>
              </div>
            </div>
          ) : (
            <div className="bg-secondary p-3 rounded-md border border-border">
              <div className="text-center text-sm font-medium">
                All exercises completed! You can finish your workout.
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col md:flex-row gap-2">
        <Button 
          variant="default" 
          className="w-full md:w-auto"
          onClick={handleContinueWorkout}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Continue
        </Button>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCompleteWorkout}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Finish
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex-1 text-error hover:text-error"
            onClick={handleCancelWorkout}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
