import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useExercisesStore } from '@/store/exercisesStore';
import { useWorkoutTemplateStore } from '@/store/workoutTemplateStore';
import { Exercise } from '@/types/Exercises';
import { WorkoutTemplate } from '@/types/Workout_Templates';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save, Edit, X, Search as SearchIcon, PlayCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "@/lib/utils";

// Type for template exercise
type TemplateExercise = WorkoutTemplate['exercises'][0];

const WorkoutTemplateBuilderPage: React.FC = () => {
  const { exercises, exerciseGroups, fetchExercises, isLoading: exercisesLoading } = useExercisesStore();
  const { templates, fetchTemplates, saveTemplate, deleteTemplate, startWorkout, isLoading: templatesLoading } = useWorkoutTemplateStore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<string>("build");
  
  // State for exercise selection
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for the template being created/edited
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<TemplateExercise[]>([]);
  
  // State for dialogs and feedback
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // State for editing existing template
  const [isEditMode, setIsEditMode] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<WorkoutTemplate | null>(null);

  // Load data on component mount
  useEffect(() => {
    fetchExercises();
    fetchTemplates();
  }, [fetchExercises, fetchTemplates]);
  
  // When entering edit mode, populate form with template data
  useEffect(() => {
    if (templateToEdit && isEditMode) {
      setTemplateName(templateToEdit.name);
      setTemplateDescription(templateToEdit.description);
      setSelectedExercises(templateToEdit.exercises);
      setActiveTab("build");
    }
  }, [templateToEdit, isEditMode]);
  
  // Filter exercises based on selected muscle group and search query
  const filteredExercises = exercises.filter((exercise) => {
    const matchesMuscleGroup = !selectedMuscleGroup || exercise.muscleGroup === selectedMuscleGroup;
    const matchesQuery = !searchQuery || 
      exercise.exercise.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesMuscleGroup && matchesQuery;
  });
  
  // Add exercise to template
  const addExerciseToTemplate = (exercise: Exercise) => {
    const exerciseToAdd: TemplateExercise = {
      name: exercise.exercise,
      muscleGroup: exercise.muscleGroup,
      sets: 3, // Default values
      reps: 10,
      weight: 0,
      rest: 60,
      notes: '',
      difficultyLevel: exercise.difficultyLevel,
      equipmentRequired: exercise.equipmentRequired,
      targetIntensity: String(exercise.targetIntensity),
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      secondaryMuscleGroup: String(exercise.secondaryMuscleGroup || ''),
      exerciseDuration: exercise.exerciseDuration,
      recoveryTime: exercise.recoveryTime,
      exerciseType: exercise.exerciseType,
      caloriesBurned: String(exercise.caloriesBurned),
      exerciseProgression: exercise.exerciseProgression,
      injuryRiskLevel: exercise.injuryRiskLevel,
      exerciseLink: exercise.exerciseLink,
      imageLink: exercise.imageLink,
      relativePath: exercise.relatedPath
    };
    
    setSelectedExercises([...selectedExercises, exerciseToAdd]);
    showToast(`${exercise.exercise} added to template`, 'success');
  };
  
  // Remove exercise from template
  const removeExerciseFromTemplate = (index: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises.splice(index, 1);
    setSelectedExercises(updatedExercises);
  };
  
  // Update exercise details in template
  const updateExerciseDetail = (index: number, field: string, value: string | number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setSelectedExercises(updatedExercises);
  };
  
  // Save workout template
  const handleSaveWorkoutTemplate = async () => {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    
    if (selectedExercises.length === 0) {
      showToast('Please add at least one exercise to the template', 'error');
      return;
    }
    
    setIsSaving(true);
    
    const newTemplate: WorkoutTemplate = {
      name: templateName,
      description: templateDescription,
      exercises: selectedExercises,
      createdAt: isEditMode && templateToEdit ? templateToEdit.createdAt : new Date().toISOString(),
      lastUsed: isEditMode && templateToEdit?.lastUsed ? templateToEdit.lastUsed : ''
    };
    
    try {
      const result = await saveTemplate(newTemplate);
      if (result.success) {
        showToast(`Workout template ${isEditMode ? 'updated' : 'saved'} successfully`, 'success');
        
        // Reset form after successful save
        setTemplateName('');
        setTemplateDescription('');
        setSelectedExercises([]);
        setSaveDialogOpen(false);
        setIsEditMode(false);
        setTemplateToEdit(null);
        
        // Switch to view tab if in edit mode
        if (isEditMode) {
          setActiveTab('view');
        }
      } else {
        showToast(`Error saving template: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${(error as Error).message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete workout template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteTemplate(templateToDelete.name);
      if (result.success) {
        showToast(`Template "${templateToDelete.name}" deleted successfully`, 'success');
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      } else {
        showToast(`Error deleting template: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${(error as Error).message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle edit template click
  const handleEditTemplate = (template: WorkoutTemplate) => {
    setTemplateToEdit(template);
    setIsEditMode(true);
  };
  
  // Reset form for new template
  const handleNewTemplate = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedExercises([]);
    setIsEditMode(false);
    setTemplateToEdit(null);
    setActiveTab('build');
  };
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Workout Templates</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">Build Template</TabsTrigger>
            <TabsTrigger value="view">View Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="mt-6">
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="My Workout Template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description (Optional)</Label>
                  <Input
                    id="template-description"
                    placeholder="Description of your workout template..."
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="muscle-group">Filter by Muscle Group</Label>                  <Select 
                    value={selectedMuscleGroup || 'all'} 
                    onValueChange={(value) => setSelectedMuscleGroup(value === 'all' ? null : value)}
                  >
                    <SelectTrigger id="muscle-group">
                      <SelectValue placeholder="All Muscle Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Muscle Groups</SelectItem>
                      {exerciseGroups.map((group) => (
                        <SelectItem key={group.muscleGroup} value={group.muscleGroup}>
                          {group.muscleGroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search Exercises</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by name..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Exercise Library</h2>
                
                {exercisesLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercise</TableHead>
                          <TableHead>Muscle Group</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExercises.length > 0 ? (
                          filteredExercises.map((exercise, index) => (
                            <TableRow key={`${exercise.exercise}-${index}`}>
                              <TableCell>{exercise.exercise}</TableCell>
                              <TableCell>{exercise.muscleGroup}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addExerciseToTemplate(exercise)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No exercises found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </Card>
              
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Selected Exercises</h2>
                <ScrollArea className="h-[400px] mb-4">
                  {selectedExercises.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercise</TableHead>
                          <TableHead>Sets</TableHead>
                          <TableHead>Reps</TableHead>
                          <TableHead>Rest (s)</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExercises.map((exercise, index) => (
                          <TableRow key={index}>
                            <TableCell>{exercise.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={exercise.sets}
                                min={1}
                                className="w-16"
                                onChange={(e) => updateExerciseDetail(index, 'sets', parseInt(e.target.value) || 1)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={exercise.reps}
                                min={1}
                                className="w-16"
                                onChange={(e) => updateExerciseDetail(index, 'reps', parseInt(e.target.value) || 1)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={exercise.rest}
                                min={0}
                                className="w-16"
                                onChange={(e) => updateExerciseDetail(index, 'rest', parseInt(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExerciseFromTemplate(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No exercises added yet. Add some from the library.
                    </div>
                  )}
                </ScrollArea>
                
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={selectedExercises.length === 0 || !templateName.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Update' : 'Save'} Template
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="view" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={handleNewTemplate}>
                <Plus className="mr-2 h-4 w-4" /> New Template
              </Button>
            </div>
            
            {templatesLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                <p className="text-muted-foreground mb-4">Create your first workout template to get started.</p>
                <Button onClick={handleNewTemplate}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Template
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.name} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setTemplateToDelete(template);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Exercises:</span>{' '}
                        <span className="font-medium">{template.exercises.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        <span className="font-medium">{formatDate(template.createdAt)}</span>
                      </div>
                    </div>
                    
                    {template.exercises.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Exercises:</h4>
                        <ScrollArea className="h-32">
                          <ul className="space-y-1">
                            {template.exercises.slice(0, 5).map((exercise, idx) => (
                              <li key={idx} className="text-sm">
                                {exercise.name} - {exercise.sets}×{exercise.reps}
                              </li>
                            ))}
                            {template.exercises.length > 5 && (
                              <li className="text-sm text-muted-foreground">
                                +{template.exercises.length - 5} more
                              </li>
                            )}
                          </ul>
                        </ScrollArea>
                      </div>
                    )}
                      <div className="flex justify-end">
                      <Button 
                        size="sm"                        onClick={async () => {
                          const result = await startWorkout(template.name);
                          if (result.success) {
                            showToast(`Workout started with template "${template.name}"`, 'success');
                            // Redirect to the workout page using our router
                            router.push('/workout');
                          } else {
                            showToast(`Error starting workout: ${result.error}`, 'error');
                          }
                        }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Workout
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Save Template Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Update' : 'Save'} Workout Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to {isEditMode ? 'update' : 'save'} this workout template?
              </DialogDescription>
            </DialogHeader>
            <div>
              <p><strong>Template Name:</strong> {templateName}</p>
              <p><strong>Exercises:</strong> {selectedExercises.length}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWorkoutTemplate} disabled={isSaving}>
                {isSaving ? "Saving..." : (isEditMode ? "Update" : "Save") + " Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Template Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Workout Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {templateToDelete && (
              <div>
                <p><strong>Template Name:</strong> {templateToDelete.name}</p>
                <p><strong>Exercises:</strong> {templateToDelete.exercises.length}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTemplate} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Toast Notification */}
        {toastVisible && (
          <div className={`fixed bottom-4 right-4 z-50 bg-background border shadow-lg rounded-md px-4 py-2 flex items-center gap-2 ${
            toastType === 'error' ? 'border-destructive text-destructive' : 'border-primary text-primary'
          }`}>
            {toastMessage}
            <button onClick={() => setToastVisible(false)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkoutTemplateBuilderPage;