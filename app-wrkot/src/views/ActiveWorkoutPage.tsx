import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useWorkoutTemplateStore } from '@/store/workoutTemplateStore';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Dumbbell, Clock, CheckCircle, ArrowLeft, Save, Edit, Plus, Trash2, PlayCircle, Star } from "lucide-react";
import { useRouter } from '@/lib/utils';

const ActiveWorkoutPage: React.FC = () => {
  const { activeWorkout, updateExerciseProgress, updateActiveWorkout, completeWorkout, addExerciseSet } = useWorkoutTemplateStore();
  const { addWorkoutLog } = useWorkoutLogStore();
  const router = useRouter();
  
  // Set up state
  const [notes, setNotes] = useState("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [exerciseLogOpen, setExerciseLogOpen] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restStartTime, setRestStartTime] = useState<number | null>(null);
  const [currentLogExercise, setCurrentLogExercise] = useState<{
    name: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    weight: number;
    setsCompleted?: number;
    index: number;
    rating?: number;
  } | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number>(3); // Default rating (1-5)  
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedRestTime, setElapsedRestTime] = useState(0); // track elapsed rest time
  
  // Set up defaults
  const defaultRestBetweenSets = 60; // seconds
  const defaultRestBetweenExercises = 90; // seconds
    // Check if we have an active workout, if not redirect to dashboard
  useEffect(() => {
    if (!activeWorkout) {
      router.push('/');
    } else {
      // Initialize notes from active workout
      setNotes(activeWorkout.notes || "");
      
      // Find the first incomplete exercise
      const firstIncompleteIdx = activeWorkout.exercises.findIndex(
        ex => (ex.setsCompleted || 0) < ex.sets
      );
      
      if (firstIncompleteIdx !== -1) {
        setCurrentExerciseIndex(firstIncompleteIdx);
      }
    }
  }, [activeWorkout, router]);
  
  // Update form values when currentLogExercise changes
  useEffect(() => {
    if (currentLogExercise) {
      setCurrentWeight(currentLogExercise.weight || 0);
      setCurrentReps(currentLogExercise.reps || 0);
    }
  }, [currentLogExercise]);
  
  // Format time since workout started
  const formatElapsedTime = () => {
    if (!activeWorkout) return "00:00";
    
    const startTime = new Date(activeWorkout.startTime);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    
    const minutes = Math.floor((diffMs / 1000) / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours > 0 ? `${hours}h ` : ''}${mins < 10 ? '0' : ''}${mins}m`;
  };
    // Format rest timer
  const formatRestTime = () => {
    if (!restTimerActive || !restStartTime) return "00:00";
    
    const now = Date.now();
    const elapsedSec = Math.floor((now - restStartTime) / 1000);
    
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Start rest timer
  const startRestTimer = (duration = defaultRestBetweenSets) => {
    setRestStartTime(Date.now());
    setRestTimerActive(true);
    toast(`Rest Timer Started`, {
      description: `${duration} seconds rest timer started`,
    });
  };
  
  // Stop rest timer
  const stopRestTimer = () => {
    setRestTimerActive(false);
    setRestStartTime(null);
  };
    // Function to manually stop the rest timer (can be called from UI)
  const handleStopRestTimer = () => {
    stopRestTimer();
    toast("Rest Timer Stopped", {
      description: "Rest timer has been stopped",
    });
  };
  
  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!activeWorkout || !activeWorkout.exercises) return 0;
    
    let totalSets = 0;
    let completedSets = 0;
    
    activeWorkout.exercises.forEach(ex => {
      totalSets += ex.sets;
      completedSets += ex.setsCompleted || 0;
    });
    
    return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  };
    // Handle set complete
  const handleSetComplete = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    const currentSetsCompleted = exercise.setsCompleted || 0;
    
    if (currentSetsCompleted < exercise.sets) {
      // Open the exercise log dialog
      setCurrentExerciseIndex(exerciseIndex);
      setCurrentWeight(exercise.weight || 0);
      setCurrentReps(exercise.reps || 0);
      setCurrentRating(3); // Default rating
      setCurrentLogExercise({
        ...exercise,
        index: exerciseIndex
      });
      setExerciseLogOpen(true);
    }
  };
  
  // Handle log submission
  const handleLogSubmit = async () => {
    if (!activeWorkout || currentExerciseIndex === null || !currentLogExercise) return;
    
    setIsSaving(true);
    
    try {
      const exerciseIndex = currentLogExercise.index;
      const exercise = activeWorkout.exercises[exerciseIndex];
      const currentSetsCompleted = exercise.setsCompleted || 0;
      
      // Update the exercise progress in the active workout
      if (currentSetsCompleted < exercise.sets) {
        // First update the exercise with the new weight/reps
        const updatedExercises = [...activeWorkout.exercises];
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          weight: currentWeight,
          reps: currentReps,
          setsCompleted: currentSetsCompleted + 1,
          percentComplete: ((currentSetsCompleted + 1) / exercise.sets) * 100
        };
        
        // Update the active workout with all changes at once
        updateActiveWorkout({ exercises: updatedExercises });
        
        // Save to workout log sheet      
        try {
          await addWorkoutLog({
            date: new Date().toISOString().split("T")[0],
            muscleGroup: exercise.muscleGroup,
            exercise: exercise.name,
            reps: currentReps,
            weight: currentWeight,
            rating: currentRating,
            restTime: exercise.rest || defaultRestBetweenSets
          });
          
          toast.success("Set Completed", {
            description: `${exercise.name} set ${currentSetsCompleted + 1}/${exercise.sets} logged`,
          });
        } catch (error) {
          toast.error("Error", {
            description: "Failed to log workout set. Will try again when online.",
          });
          toast("Debug Info", {
            description: "Check network connectivity and try again",
          });
        }
          // Close the dialog
        setExerciseLogOpen(false);
                
        // Check if all sets are complete
        if (currentSetsCompleted + 1 >= exercise.sets) {
          // Find next incomplete exercise
          const nextIncompleteIdx = activeWorkout.exercises.findIndex(
            (ex, idx) => idx > exerciseIndex && (ex.setsCompleted || 0) < ex.sets
          );
          
          if (nextIncompleteIdx !== -1) {
            // Start longer rest between exercises
            startRestTimer(defaultRestBetweenExercises);
            // Set the next exercise as current
            setCurrentExerciseIndex(nextIncompleteIdx);
          } else {
            // Start regular rest timer
            startRestTimer(exercise.rest || defaultRestBetweenSets);
            
            // All exercises complete          
            toast.success("Workout Complete", {
              description: "All exercises have been completed! You can finish your workout.",
            });
          }
        } else {
          // Start regular rest timer for the same exercise's next set
          startRestTimer(exercise.rest || defaultRestBetweenSets);
        }
        }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update exercise progress. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle exercise notes save
  const handleSaveExerciseNotes = () => {
    if (!activeWorkout || currentExerciseIndex === null) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[currentExerciseIndex] = {
      ...updatedExercises[currentExerciseIndex],
      notes: exerciseNotes
    };
      updateActiveWorkout({ exercises: updatedExercises });
    setNotesDialogOpen(false);
    toast("Notes Saved", {
      description: "Exercise notes have been updated.",
    });
  };
  
  // Handle workout notes save
  const handleSaveWorkoutNotes = () => {
    if (!activeWorkout) return;
      updateActiveWorkout({ notes });
    toast("Notes Saved", {
      description: "Workout notes have been updated.",
    });
  };
  
  // Handle workout complete
  const handleCompleteWorkout = async () => {
    if (!activeWorkout) return;
      const result = await completeWorkout();
    if (result.success) {
      toast.success("Workout Completed", {
        description: "Your workout has been saved.",
      });
      
      router.push('/');
    } else {
      toast.error("Error", {
        description: result.error || "Failed to complete workout",
      });
    }
  };
  
  // Handle add extra set
  const handleAddExtraSet = (exerciseIndex: number) => {    if (!activeWorkout) return;
    addExerciseSet(exerciseIndex);
    
    toast("Set Added", {
      description: `Added an extra set to ${activeWorkout.exercises[exerciseIndex].name}`,
    });
  };
  // Update UI when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (restTimerActive) {
      // Create a new interval that runs every 1000ms (1 second)
      interval = setInterval(() => {
        // This empty callback forces React to re-render
        // which will update the timer display since formatRestTime reads current time
        forceUpdate({});
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimerActive]);
  
  // Create a simple method to force component update
  const [, forceUpdate] = useState({});
  
  if (!activeWorkout) {
    return <div className="flex justify-center items-center h-full">Loading workout...</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold ml-2">Active Workout</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{formatElapsedTime()}</span>
            </div>            
            {restTimerActive && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Rest: {formatRestTime()}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={handleStopRestTimer}
                >
                  Stop
                </Button>
              </div>
            )}
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setConfirmCompleteOpen(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> 
              Finish Workout
            </Button>
          </div>
        </div>
        
        {/* Workout Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{activeWorkout.templateName}</h2>
                <p className="text-muted-foreground">{activeWorkout.description}</p>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>Overall Progress:</span>
                  <span className="font-medium">{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Exercises</h2>
            </div>
            
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {activeWorkout.exercises.map((exercise, idx) => {
                  const isCompleted = (exercise.setsCompleted || 0) >= exercise.sets;
                  const isCurrent = idx === currentExerciseIndex;
                  
                  return (
                    <Card 
                      key={idx} 
                      className={`${isCurrent ? 'border-primary/50 bg-primary/5' : isCompleted ? 'border-muted bg-muted/20' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Dumbbell className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                              <h3 className="font-medium text-lg">
                                {exercise.name}
                              </h3>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.weight > 0 && ` @ ${exercise.weight}`}
                            </div>
                          </div>
                          
                          <Badge>
                            {(exercise.setsCompleted || 0)}/{exercise.sets} Sets
                          </Badge>
                        </div>
                        
                        <Progress 
                          value={((exercise.setsCompleted || 0) / exercise.sets) * 100} 
                          className="h-1.5 mb-4"
                        />
                        
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: exercise.sets }).map((_, setIdx) => {
                            const isSetCompleted = (exercise.setsCompleted || 0) > setIdx;
                            
                            return (
                              <Button
                                key={setIdx}
                                size="sm"
                                variant={isSetCompleted ? "default" : "outline"}
                                className={isSetCompleted ? "opacity-70" : ""}
                                onClick={() => !isSetCompleted && handleSetComplete(idx)}
                                disabled={isSetCompleted}
                              >
                                {isSetCompleted ? (
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                ) : null}
                                Set {setIdx + 1}
                              </Button>
                            );
                          })}
                          
                          {/* Button to add an extra set if all sets are completed */}
                          {isCompleted && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAddExtraSet(idx)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Extra Set
                            </Button>
                          )}
                        </div>
                        
                        {exercise.notes ? (
                          <div className="mt-3 text-sm p-2 bg-muted rounded-md">
                            <span className="font-medium">Notes:</span> {exercise.notes}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => {
                              setCurrentExerciseIndex(idx);
                              setExerciseNotes(exercise.notes || '');
                              setNotesDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Add Notes
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-2">Workout Notes</h3>
                
                <Textarea
                  placeholder="Add notes about your workout here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[150px] mb-4"
                />
                
                <Button onClick={handleSaveWorkoutNotes} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
        {/* Exercise Log Dialog */}
      <Dialog open={exerciseLogOpen} onOpenChange={setExerciseLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Exercise Set</DialogTitle>
            <DialogDescription>
              Record details for {currentLogExercise?.name} - Set {(currentLogExercise?.setsCompleted || 0) + 1}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min={0}
                  value={currentReps}
                  onChange={(e) => setCurrentReps(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Rating (How difficult was this set?)</Label>
              <div className="flex justify-between pt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={currentRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentRating(rating)}
                    className="px-3"
                  >
                    {rating}
                    {rating === 1 && " - Easy"}
                    {rating === 3 && " - Normal"}
                    {rating === 5 && " - Hard"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseLogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleLogSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Exercise Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Notes</DialogTitle>
            <DialogDescription>
              Add notes for {currentExerciseIndex !== null ? activeWorkout.exercises[currentExerciseIndex]?.name : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Add notes about this exercise (form, modifications, etc.)..."
              value={exerciseNotes}
              onChange={(e) => setExerciseNotes(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExerciseNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Complete Workout Confirmation */}
      <Dialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to finish this workout? This action will save your progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span>Progress:</span>
              <Badge>{calculateOverallProgress()}% Complete</Badge>
            </div>
            
            <Progress value={calculateOverallProgress()} />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteWorkout}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ActiveWorkoutPage;
