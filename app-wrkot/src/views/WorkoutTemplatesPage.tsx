import React, { useEffect } from 'react';
import { useWorkoutTemplateStore, StoredWorkoutTemplate } from '@/store/workoutTemplateStore';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Play, Edit, Trash2, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from 'sonner';

export const WorkoutTemplatesPage: React.FC = () => {
  // Select state values and actions separately to potentially stabilize references
  const templates = useWorkoutTemplateStore(state => state.templates);
  const isLoading = useWorkoutTemplateStore(state => state.isLoading);
  const error = useWorkoutTemplateStore(state => state.error);
  const deleteTemplate = useWorkoutTemplateStore(state => state.deleteTemplate);
  const fetchTemplates = useWorkoutTemplateStore(state => state.fetchTemplates);
  const isDataFetched = useWorkoutTemplateStore(state => state.isDataFetched);

  const { setCurrentView } = useAppStore(state => ({ setCurrentView: state.setCurrentView }));

  useEffect(() => {
    // Fetch templates only if not already fetched or if the list is empty
    // This helps prevent re-fetching on every render if fetchTemplates reference changes
    if (!isDataFetched || templates.length === 0) {
      fetchTemplates();
    }
  }, [fetchTemplates, isDataFetched, templates.length]); // Add all relevant dependencies

  const handleCreateNew = () => {
    setCurrentView('workoutTemplateBuilder');
    console.log("Navigate to create new template page");
  };

  const handleStartWorkout = (template: StoredWorkoutTemplate) => {
    localStorage.setItem('selectedTemplateId', template.id);
    setCurrentView('activeWorkout');
    console.log(`Starting workout with template: ${template.name}`);
    toast.info(`Starting workout: ${template.name}`);
  };
  
  const handleEditTemplate = (templateId: string) => {
    localStorage.setItem('editTemplateId', templateId);
    setCurrentView('workoutTemplateBuilder');
    const templateToEdit = templates.find(t => t.id === templateId);
    toast.info(`Editing template: ${templateToEdit?.name || 'template'}`);
    console.log(`Editing template ID: ${templateId}`);
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (window.confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      const success = await deleteTemplate(templateId);
      if (success) {
        toast.success(`Template "${templateName}" deleted.`);
      } else {
        // Error is likely handled by the store and displayed via `error` state or a generic toast
        toast.error(`Failed to delete template "${templateName}". Check console for details.`);
      }
    }
  };

  if (isLoading && templates.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Workout Templates</h1>
          </div>
          <p>Loading templates...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Display error from the store if it occurs during fetch
  if (error && templates.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-6">Workout Templates</h1>
          <p className="text-red-500">Error loading templates: {error}</p>
          <Button onClick={() => fetchTemplates(true)} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold">Workout Templates</h1>
          <div className="flex gap-2">
            <Button onClick={() => fetchTemplates(true)} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={handleCreateNew} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
            </Button>
          </div>
        </div>

        {templates.length === 0 && !isLoading && (
          <Card className="text-center py-10">
            <CardHeader>
              <CardTitle>No Templates Yet</CardTitle>
              <CardDescription>
                Get started by creating your first workout template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{template.name}</CardTitle>
                <CardDescription className="h-10 overflow-hidden text-ellipsis">
                  {template.description || 'No description.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Exercises: {template.exercises.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </p>
                 {template.lastUsed && (
                    <p className="text-xs text-muted-foreground">
                        Last Used: {new Date(template.lastUsed).toLocaleDateString()}
                    </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                    onClick={() => handleStartWorkout(template)} 
                    className="w-full sm:flex-1"
                    variant="default"
                >
                  <Play className="mr-2 h-4 w-4" /> Start Workout
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                        onClick={() => handleEditTemplate(template.id)} 
                        variant="outline" 
                        size="icon" 
                        className="flex-1 sm:flex-none"
                        aria-label="Edit Template"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        onClick={() => handleDeleteTemplate(template.id, template.name)} 
                        variant="destructive" 
                        size="icon" 
                        className="flex-1 sm:flex-none"
                        aria-label="Delete Template"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
