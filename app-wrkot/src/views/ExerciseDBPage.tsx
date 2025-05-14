import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { useExercisesStore } from '@/store/exercisesStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';
import { DashboardLayout } from '@/components/DashboardLayout'; // Added DashboardLayout import

const ExerciseDBPage: React.FC = () => {
  const { exercises, fetchExercises, isLoading, error, getExercisesByMuscleGroup, getMuscleGroupsByExercise, getAllUniqueExerciseNames } = useExercisesStore();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<typeof exercises>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const muscleGroupOptions = useMemo(() => {
    const groups = new Set(exercises.map(ex => ex.muscleGroup));
    return Array.from(groups).sort();
  }, [exercises]);

  const exerciseOptions = useMemo(() => {
    if (selectedMuscleGroup) {
      return getExercisesByMuscleGroup(selectedMuscleGroup).sort();
    }
    return getAllUniqueExerciseNames().sort();
  }, [selectedMuscleGroup, getAllUniqueExerciseNames, getExercisesByMuscleGroup]);
  
  const handleMuscleGroupChange = (value: string) => {
    setSelectedMuscleGroup(value === "_all_muscle_groups_" ? "" : value);
    setSelectedExercise(''); 
    setSearchTerm('');
    setHasSearched(false);
  };

  const handleExerciseChange = (value: string) => {
    const actualValue = value === "_all_exercises_" ? "" : value;
    setSelectedExercise(actualValue);
    if (actualValue) {
        const muscleGroups = getMuscleGroupsByExercise(actualValue);
        if (muscleGroups.length > 0 && !muscleGroups.includes(selectedMuscleGroup)) {
            setSelectedMuscleGroup(muscleGroups[0]);
        }
    }
    setSearchTerm('');
    setHasSearched(false);
  };

  const handleSearch = useCallback(() => {
    if (!selectedMuscleGroup && !selectedExercise && !debouncedSearchTerm) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    let filtered = exercises;

    if (selectedMuscleGroup) {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedMuscleGroup);
    }

    if (selectedExercise) {
      filtered = filtered.filter(ex => ex.exercise === selectedExercise);
    }
    
    if (debouncedSearchTerm) {
        filtered = filtered.filter(ex => 
            ex.exercise.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            ex.muscleGroup.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }

    setSearchResults(filtered);
  }, [exercises, selectedMuscleGroup, selectedExercise, debouncedSearchTerm, setSearchResults, setHasSearched]);
  
  useEffect(() => {
     if (hasSearched || debouncedSearchTerm) {
        handleSearch();
    } else {
        setSearchResults([]);
    }
  // exercises is a dependency of handleSearch, which is a dependency here.
  // No need to list exercises directly if handleSearch correctly lists it.
  }, [debouncedSearchTerm, selectedMuscleGroup, selectedExercise, hasSearched, handleSearch]);


  // Image caching (basic example, consider a more robust solution for production)
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  useEffect(() => {
    let newImagesAdded = false;
    const updatedCachedImages = { ...cachedImages };

    searchResults.forEach(ex => {
      if (ex.imageLink && !updatedCachedImages[ex.imageLink]) {
        const img = new Image();
        img.src = ex.imageLink;
        img.onload = () => {
          // Important: Update state based on the previous state
          // to avoid issues with stale closures if multiple images load quickly.
          setCachedImages(prev => ({ ...prev, [ex.imageLink!]: ex.imageLink! }));
        };
        // For the purpose of this effect, we mark that an image is being processed
        // even if it hasn't loaded yet, to prevent re-triggering for the same image.
        // The actual caching happens in img.onload.
        updatedCachedImages[ex.imageLink] = 'loading'; // or a placeholder
        newImagesAdded = true; // Though this specific flag isn't strictly needed with the onload update strategy
      }
    });
    // This effect primarily triggers the loading of images.
    // The actual update to cachedImages state is handled by individual img.onload callbacks.
    // The dependency on cachedImages is to re-evaluate if searchResults change and some images
    // in the new results are not yet in cachedImages.
  }, [searchResults, cachedImages]);

  // Initial loading state for the whole page before any search is made
  // The isLoading from useExercisesStore refers to the initial data fetch.
  const storeLoading = useExercisesStore(state => state.isLoading);

  if (storeLoading && exercises.length === 0) { // Show loading only if exercises are not yet populated
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,64px))]">
            <p>Loading exercise data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,64px))]">
            <p>Error: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout> { /* Wrap content with DashboardLayout */}
      <div className="container mx-auto p-4 md:p-8 bg-background text-foreground">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">Exercise Database</h1>
          <p className="text-muted-foreground mt-2">Explore and discover new exercises.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-card rounded-xl shadow-lg sticky top-[var(--header-height,64px)] z-10">
          <div className="md:col-span-1">
            <label htmlFor="muscleGroupSelect" className="block text-sm font-medium text-muted-foreground mb-1">Muscle Group</label>
            <Select value={selectedMuscleGroup || "_all_muscle_groups_"} onValueChange={handleMuscleGroupChange}>
              <SelectTrigger id="muscleGroupSelect" className="w-full bg-input border-border">
                <SelectValue placeholder="Select Muscle Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_muscle_groups_">All Muscle Groups</SelectItem>
                {muscleGroupOptions.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="exerciseSelect" className="block text-sm font-medium text-muted-foreground mb-1">Exercise</label>
            <Select value={selectedExercise || "_all_exercises_"} onValueChange={handleExerciseChange}>
              <SelectTrigger id="exerciseSelect" className="w-full bg-input border-border">
                <SelectValue placeholder="Select Exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_exercises_">All Exercises</SelectItem>
                {exerciseOptions.map(ex => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1 flex items-end">
            <Button onClick={handleSearch} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Search Exercises
            </Button>
          </div>
        </div>
        
        {/* Search results area */}
        {hasSearched && isLoading && <div className="text-center py-4"><p>Searching...</p></div>} {/* This isLoading is the one from useExercisesStore, consider a local loading state for search if needed */}
        {!storeLoading && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No exercises found matching your criteria.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-var(--header-height,64px)-200px)]"> {/* Adjust height considering sticky filter bar and header */}
          <AnimatePresence>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4" /* Added pt-4 for spacing from sticky filter */
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {searchResults.map((ex, index) => (
                <motion.div
                  key={`${ex.exercise}-${ex.muscleGroup}-${index}`} // More robust key
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { delay: index * 0.05 } }
                  }}
                  layout
                >
                  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card h-full flex flex-col">
                    <CardHeader className="p-0 relative aspect-square">
                      {ex.imageLink && cachedImages[ex.imageLink] ? (
                        <img 
                          src={cachedImages[ex.imageLink]} 
                          alt={ex.exercise} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      ) : ex.imageLink ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">Loading image...</p>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">No Image</p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-primary mb-1 truncate" title={ex.exercise}>{ex.exercise}</CardTitle>
                        <p className="text-sm text-muted-foreground mb-2 capitalize">{ex.muscleGroup}</p>
                        <div className="text-xs space-y-1 text-foreground/80">
                          {ex.difficultyLevel && <p><strong>Difficulty:</strong> {ex.difficultyLevel}</p>}
                          {ex.equipmentRequired && <p><strong>Equipment:</strong> {ex.equipmentRequired}</p>}
                          {ex.exerciseType && <p><strong>Type:</strong> {ex.exerciseType}</p>}
                        </div>
                      </div>
                      {ex.exerciseLink && (
                        <Button variant="link" size="sm" asChild className="mt-3 p-0 h-auto self-start">
                          <a href={ex.exerciseLink} target="_blank" rel="noopener noreferrer">
                            Watch Video
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
        {!hasSearched && !storeLoading && (
           <div className="text-center py-10 mt-8">
              <p className="text-xl text-muted-foreground">Select filters and click "Search Exercises" to view data.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExerciseDBPage;

