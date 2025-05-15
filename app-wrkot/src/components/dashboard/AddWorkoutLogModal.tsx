import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { WorkoutLogEntry } from '../../types/Workout_Log';

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  muscleGroup: z.string().min(1, "Muscle group is required"),
  exercise: z.string().min(1, "Exercise is required"),
  reps: z.coerce.number().min(0, "Reps must be non-negative").default(0),
  weight: z.coerce.number().min(0, "Weight must be non-negative").default(0),
  rating: z.coerce.number().min(1, "Rating must be between 1-5").max(5, "Rating must be between 1-5").default(3),
  restTime: z.coerce.number().min(0, "Rest time must be non-negative").optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddWorkoutLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<FormValues & { id?: string }>;
}

export const AddWorkoutLogModal: React.FC<AddWorkoutLogModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const addWorkoutLog = useWorkoutLogStore((state) => state.addWorkoutLog);
  const editWorkoutLog = useWorkoutLogStore((state) => state.editWorkoutLog);
  const workoutLogs = useWorkoutLogStore((state) => state.workoutLogs);

  const [muscleGroupOpen, setMuscleGroupOpen] = React.useState(false);
  const [exerciseOpen, setExerciseOpen] = React.useState(false);
  
  const [muscleGroupInput, setMuscleGroupInput] = React.useState(initialData?.muscleGroup || "");
  const [exerciseInput, setExerciseInput] = React.useState(initialData?.exercise || "");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split("T")[0],
      muscleGroup: initialData?.muscleGroup || "",
      exercise: initialData?.exercise || "",
      reps: initialData?.reps ?? 0,
      weight: initialData?.weight ?? 0,
      rating: initialData?.rating ?? 3,
      restTime: initialData?.restTime ?? null,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
      if (name === "muscleGroup" || (type === undefined && values.muscleGroup !== undefined)) {
        setMuscleGroupInput(values.muscleGroup || "");
      }
      if (name === "exercise" || (type === undefined && values.exercise !== undefined)) {
        setExerciseInput(values.exercise || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (isOpen) {
      const defaultVals = {
        date: initialData?.date || new Date().toISOString().split("T")[0],
        muscleGroup: initialData?.muscleGroup || "",
        exercise: initialData?.exercise || "",
        reps: initialData?.reps ?? 0,
        weight: initialData?.weight ?? 0,
        rating: initialData?.rating ?? 3,
        restTime: initialData?.restTime ?? null,
      };
      form.reset(defaultVals);
      setMuscleGroupInput(defaultVals.muscleGroup);
      setExerciseInput(defaultVals.exercise);
    }
  }, [isOpen, initialData, form]);

  const muscleGroups = React.useMemo(() => {
    const uniqueMuscleGroups = new Set(workoutLogs.map(log => log.muscleGroup));
    return Array.from(uniqueMuscleGroups);
  }, [workoutLogs]);

  const exercises = React.useMemo(() => {
    const uniqueExercises = new Set(workoutLogs.map(log => log.exercise));
    return Array.from(uniqueExercises);
  }, [workoutLogs]);

  const filteredMuscleGroups = React.useMemo(() => {
    if (!muscleGroupInput) return muscleGroups;
    return muscleGroups.filter(mg => mg.toLowerCase().includes(muscleGroupInput.toLowerCase()));
  }, [muscleGroupInput, muscleGroups]);

  const currentSelectedMuscleGroup = form.getValues("muscleGroup");

  const filteredExercises = React.useMemo(() => {
    let exercisesForGroup = exercises;
    if (currentSelectedMuscleGroup) {
      const exercisesInGroup = new Set(
        workoutLogs
          .filter(log => log.muscleGroup === currentSelectedMuscleGroup)
          .map(log => log.exercise)
      );
      if (exercisesInGroup.size > 0) {
        exercisesForGroup = Array.from(exercisesInGroup);
      }
    }
    if (!exerciseInput) return exercisesForGroup;
    return exercisesForGroup.filter(ex => ex.toLowerCase().includes(exerciseInput.toLowerCase()));
  }, [exerciseInput, exercises, workoutLogs, currentSelectedMuscleGroup]);

  const onSubmit = async (data: FormValues) => {
    const dataToSubmit: Omit<WorkoutLogEntry, 'id' | 'rowIndex'> = {
      date: data.date,
      muscleGroup: data.muscleGroup,
      exercise: data.exercise,
      reps: Number(data.reps),
      weight: Number(data.weight),
      rating: Number(data.rating),
      restTime: data.restTime ? Number(data.restTime) : null,
    };

    try {
      if (initialData?.id) {
        const logToEdit = workoutLogs.find(log => log.id === initialData.id);
        if (logToEdit) {
            await editWorkoutLog({ 
                ...dataToSubmit, 
                id: initialData.id, 
                rowIndex: logToEdit.rowIndex, 
                isSynced: logToEdit.isSynced, 
            });
        } else {
            console.error("Log to edit not found");
        }
      } else {
        await addWorkoutLog(dataToSubmit);
      }
      form.reset({
        date: new Date().toISOString().split("T")[0],
        muscleGroup: "",
        exercise: "",
        reps: 0,
        weight: 0,
        rating: 3,
        restTime: null,
      });
      setMuscleGroupInput("");
      setExerciseInput("");
      onClose();
    } catch (error) {
      console.error("Failed to submit workout log:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Workout</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
                    <Popover open={muscleGroupOpen} onOpenChange={setMuscleGroupOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={muscleGroupOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && !muscleGroupInput && "text-muted-foreground"
                            )}
                          >
                            {muscleGroupInput || field.value
                              ? muscleGroupInput || field.value
                              : "Select or type muscle group"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search muscle group..."
                            value={muscleGroupInput}
                            onValueChange={(search) => {
                              setMuscleGroupInput(search);
                              if (!search) {
                                form.setValue("muscleGroup", "");
                              }
                            }}
                          />
                          <CommandEmpty>No muscle group found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredMuscleGroups.map((item) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={(currentValue) => {
                                  const selectedValue = muscleGroups.find(mg => mg.toLowerCase() === currentValue) || currentValue;
                                  form.setValue("muscleGroup", selectedValue);
                                  setMuscleGroupInput(selectedValue);
                                  form.trigger("muscleGroup");
                                  setMuscleGroupOpen(false);
                                  form.setValue("exercise", "");
                                  setExerciseInput("");
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
                    <Popover open={exerciseOpen} onOpenChange={setExerciseOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={exerciseOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && !exerciseInput && "text-muted-foreground"
                            )}
                          >
                            {exerciseInput || field.value 
                              ? exerciseInput || field.value
                              : "Select or type exercise"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search exercise..."
                            value={exerciseInput}
                            onValueChange={(search) => {
                              setExerciseInput(search);
                              if (!search) {
                                form.setValue("exercise", "");
                              }
                            }}
                          />
                          <CommandEmpty>No exercise found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredExercises.map((item) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={(currentValue) => {
                                  const selectedValue = filteredExercises.find(ex => ex.toLowerCase() === currentValue) || currentValue;
                                  form.setValue("exercise", selectedValue);
                                  setExerciseInput(selectedValue);
                                  form.trigger("exercise");
                                  setExerciseOpen(false);

                                  if (!form.getValues("muscleGroup") && selectedValue) {
                                    const logWithExercise = workoutLogs.find(log => log.exercise === selectedValue);
                                    if (logWithExercise) {
                                      form.setValue("muscleGroup", logWithExercise.muscleGroup);
                                      setMuscleGroupInput(logWithExercise.muscleGroup);
                                    }
                                  }
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
              <Button type="submit">
                Add Workout
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkoutLogModal;
