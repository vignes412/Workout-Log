import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
// Select components not needed - using Command/Popover instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from '@/components/ui/slider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { useExercisesStore } from '@/store/exercisesStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const formSchema = z.object({
  date: z.string().min(1, { message: 'Date is required' }),
  muscleGroup: z.string().min(1, { message: 'Muscle group is required' }),
  exercise: z.string().min(1, { message: 'Exercise is required' }),
  reps: z.number().min(1, { message: 'At least 1 rep is required' }).max(1000),
  weight: z.number().min(0).max(1000),
  rating: z.number().min(1, { message: 'Rating is required' }).max(10),
  restTime: z.number().min(0).max(600).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddWorkoutLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWorkoutLogModal: React.FC<AddWorkoutLogModalProps> = ({ isOpen, onClose }) => {
  const [exercisesOpen, setExercisesOpen] = useState(false);
  const [muscleGroupsOpen, setMuscleGroupsOpen] = useState(false);
  
  const { 
    addWorkoutLog, 
    isLoading: isSaving 
  } = useWorkoutLogStore();
  
  const { 
    exercises, 
    exerciseGroups,
    fetchExercises, 
    isLoading: isLoadingExercises,
    isDataFetched,
    getExercisesByMuscleGroup
  } = useExercisesStore();
  
  // Using toast directly from sonner
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      muscleGroup: '',
      exercise: '',
      reps: 10,
      weight: 0,
      rating: 7,
      restTime: 60,
    },
  });

  const muscleGroup = form.watch('muscleGroup');
  const exercise = form.watch('exercise');
  
  // Load exercises data when the modal opens
  useEffect(() => {
    if (isOpen && !isDataFetched) {
      fetchExercises();
    }
  }, [isOpen, isDataFetched, fetchExercises]);
  
  // Get filtered list of muscle groups for the selected exercise
  const filteredMuscleGroups = exercise 
    ? exercises
        .filter(e => e.exercise.toLowerCase() === exercise.toLowerCase())
        .map(e => e.muscleGroup)
        .filter((v, i, a) => a.indexOf(v) === i) // Unique values
    : exerciseGroups.map(g => g.muscleGroup);
  
  // Get filtered list of exercises for the selected muscle group
  const filteredExercises = muscleGroup 
    ? getExercisesByMuscleGroup(muscleGroup) 
    : exercises.map(e => e.exercise).filter((v, i, a) => a.indexOf(v) === i); // Unique values
  
  const handleSubmit = async (data: FormValues) => {
    try {
      const result = await addWorkoutLog({
        date: data.date,
        muscleGroup: data.muscleGroup,
        exercise: data.exercise,
        reps: data.reps,
        weight: data.weight,
        rating: data.rating,
        restTime: data.restTime
      });
        if (result) {
        toast.success('Workout log has been added.');
        form.reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          muscleGroup: '',
          exercise: '',
          reps: 10,
          weight: 0,
          rating: 7,
          restTime: 60
        });
        
        onClose();
      }    } catch {
      toast.error('Failed to add workout log. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Workout</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="muscleGroup"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Muscle Group</FormLabel>
                    <Popover open={muscleGroupsOpen} onOpenChange={setMuscleGroupsOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={muscleGroupsOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {isLoadingExercises ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : field.value 
                              ? field.value
                              : "Select muscle group"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search muscle group..." />
                          <CommandEmpty>No muscle group found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredMuscleGroups.map((item) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={(value) => {
                                  form.setValue("muscleGroup", value);
                                  // Clear exercise if not valid for this muscle group
                                  const exercises = getExercisesByMuscleGroup(value);
                                  if (!exercises.includes(form.getValues('exercise'))) {
                                    form.setValue("exercise", '');
                                  }
                                  setMuscleGroupsOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="exercise"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Exercise</FormLabel>
                    <Popover open={exercisesOpen} onOpenChange={setExercisesOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={exercisesOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {isLoadingExercises ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : field.value 
                              ? field.value
                              : "Select exercise"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search exercise..." />
                          <CommandEmpty>No exercise found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredExercises.map((item) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={(value) => {
                                  form.setValue("exercise", value);
                                  // Only update muscle group if it's not set
                                  if (!form.getValues('muscleGroup')) {
                                    const muscleGroups = exercises
                                      .filter(e => e.exercise === value)
                                      .map(e => e.muscleGroup);
                                    if (muscleGroups.length > 0) {
                                      form.setValue("muscleGroup", muscleGroups[0]);
                                    }
                                  }
                                  setExercisesOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reps</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))} 
                        min={1} 
                        max={1000} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                        min={0} 
                        max={1000} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="restTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rest Time (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        min={0} 
                        max={600}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>How was your workout? (1-10)</FormLabel>
                    <div className="flex items-center space-x-4">
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <span className="text-lg font-bold">{field.value}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Add Workout'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkoutLogModal;
