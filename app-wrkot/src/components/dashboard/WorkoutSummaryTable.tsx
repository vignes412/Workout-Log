import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import MobileTableCell from './MobileTableCell';

// Import CSS for mobile optimizations
import '@/styles/tableResponsive.css';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight,
  ChevronLeft, 
  ChevronRight,
  ArrowDownAZ, 
  ArrowDownZA,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useBreakpointValue } from '@/hooks/useBreakpointValue';

// Import the compute metrics utility
import { computeDailyMetrics } from '@/utils/computeDailyMetrics';

// Custom debounced input component for filtering
const DebouncedInput: React.FC<{
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>> = (
  { value: initialValue, onChange, debounce = 300, ...props }
) => {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return <Input {...props} value={value} onChange={e => setValue(e.target.value)} />;
};

// Type definition for the metrics data structure
interface MetricsRow {
  id: number;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: string | number;
  totalSets: string | number;
  totalReps: string | number;
  averageReps: string | number;
  averageWeight: string | number;
  averageFatigue: string | number;
  maxWeight: number;
  intensity: string | number;
  fatigue: string | number;
  howIFeel: string;
  progressionRate: string | number;
}

// Type for column definition to include responsive priority
interface ColumnDef {
  header: string;
  accessorKey: keyof MetricsRow;
  className?: string;
  responsivePriority: number;
  sortable?: boolean;
  render?: (value: any) => React.ReactNode;
}

export const WorkoutSummaryTable: React.FC = () => {
  // Get logs from workout store
  const { workoutLogs, isLoading, error, isDataFetched, fetchWorkoutLogs } = useWorkoutLogStore();
  
  // Check breakpoint to handle responsive display
  const { isMobile, isTablet } = useBreakpointValue();
  
  // Create ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // State to track if table has horizontal overflow
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledRight, setIsScrolledRight] = useState(false);
  
  // Check for overflow when data or size changes
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setHasOverflow(scrollWidth > clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [workoutLogs, isMobile]);
  
  // Handle scroll events to update indicators
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setIsScrolledRight(scrollLeft + clientWidth >= scrollWidth - 10);
    }
  };
  
  // Fetch workout logs if not already loaded
  useEffect(() => {
    if (!isDataFetched) {
      fetchWorkoutLogs();
    }
  }, [fetchWorkoutLogs, isDataFetched]);
    // State for filtering, sorting, and pagination
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<{ key: keyof MetricsRow; direction: 'asc' | 'desc' }>({ 
    key: 'date', 
    direction: 'desc' 
  });  const [currentPage, setCurrentPage] = useState(0);  // Set page size dynamically based on device
  const [pageSize, setPageSize] = useState(10);
  
  // Update page size when screen size changes
  useEffect(() => {
    if (isMobile) {
      setPageSize(3); // Even smaller page size for mobile for better readability
    } else if (isTablet) {
      setPageSize(6); // Medium page size for tablets
    } else {
      setPageSize(10); // Default for desktop
    }
  }, [isMobile, isTablet]);

  // Convert workout logs to format needed by computeDailyMetrics
  const logsForCalculation = useMemo(() => {
    return workoutLogs.map(log => [
      log.date,
      log.muscleGroup,
      log.exercise,
      log.reps,
      log.weight,
      log.rating,
    ]);
  }, [workoutLogs]);

  // Calculate metrics using the utility function
  const dailyMetrics = useMemo(() => {
    return computeDailyMetrics(logsForCalculation);
  }, [logsForCalculation]);

  // Format dates and ensure all values are proper types
  const formattedMetrics: MetricsRow[] = useMemo(() => {
    return dailyMetrics.map((row) => {
      let formattedDate = "Invalid Date";
      try {
        const parsedDate = new Date(row.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = format(parsedDate, "yyyy-MM-dd");
        }
      } catch {
        formattedDate = "Invalid Date";
      }

      return {
        ...row,
        date: formattedDate,
        totalVolume: parseFloat(row.totalVolume.toString()),
        totalSets: parseFloat(row.totalSets.toString()),
        totalReps: parseFloat(row.totalReps.toString()),
        averageReps: parseFloat(row.averageReps.toString()),
        averageWeight: parseFloat(row.averageWeight.toString()),
        averageFatigue: parseFloat(row.averageFatigue.toString()),
        maxWeight: parseFloat(row.maxWeight.toString()),
        intensity: parseFloat(row.intensity.toString()),
        fatigue: parseFloat(row.fatigue.toString()),
        howIFeel: row.howIFeel || "N/A",
        progressionRate: row.progressionRate === "N/A" ? "N/A" : parseFloat(row.progressionRate.toString()),
      } as MetricsRow;
    });
  }, [dailyMetrics]);
  // Define the columns for our table
  const columns = useMemo<ColumnDef[]>(() => [
    { 
      header: 'Date', 
      accessorKey: 'date', 
      responsivePriority: 1, // Always visible, even on smallest screens
      sortable: true 
    },
    { 
      header: 'Muscle', // Shortened for mobile
      accessorKey: 'muscleGroup', 
      responsivePriority: 1, // Always visible, even on smallest screens
      sortable: true 
    },
    { 
      header: 'Exercise', 
      accessorKey: 'exercise', 
      responsivePriority: 1, // Always visible, even on smallest screens
      sortable: true 
    },
    { 
      header: 'Volume', 
      accessorKey: 'totalVolume', 
      responsivePriority: 2, // Visible on sm screens and up
      sortable: true 
    },
    { 
      header: 'Sets', 
      accessorKey: 'totalSets', 
      responsivePriority: 1, // Visible on sm screens and up
      sortable: true 
    },
    { 
      header: 'Reps', 
      accessorKey: 'totalReps', 
      responsivePriority: 3, // Visible on md screens and up
      sortable: true 
    },
    { 
      header: 'Avg Reps', 
      accessorKey: 'averageReps', 
      responsivePriority: 4, // Visible on lg screens and up
      sortable: true 
    },
    { 
      header: 'Avg Wt', // Shortened for mobile
      accessorKey: 'averageWeight', 
      responsivePriority: 3, // Visible on md screens and up
      sortable: true 
    },
    { 
      header: 'Fatigue', 
      accessorKey: 'averageFatigue', 
      responsivePriority: 4, // Visible on lg screens and up
      sortable: true 
    },
    { 
      header: 'Max Wt', // Shortened for mobile
      accessorKey: 'maxWeight', 
      responsivePriority: 3, // Visible on md screens and up
      sortable: true 
    },
    { 
      header: 'Int(%)', // Shortened for mobile
      accessorKey: 'intensity', 
      responsivePriority: 4, // Visible on lg screens and up
      sortable: true 
    },
    { 
      header: 'Fat(%)', // Shortened for mobile
      accessorKey: 'fatigue', 
      responsivePriority: 1, // Visible on lg screens and up
      sortable: true 
    },
    { 
      header: 'Feel', // Shortened for mobile
      accessorKey: 'howIFeel', 
      responsivePriority: 5, // Visible only on xl screens
      sortable: true 
    },
    { 
      header: 'Progress', 
      accessorKey: 'progressionRate', 
      responsivePriority: 1, // Visible on sm screens and up
      sortable: true,      render: (value) => {
        if (value === "N/A") {
          return (
            <span className="text-blue-500 flex items-center whitespace-nowrap">
              <ArrowRight className="mr-1 h-4 w-4 flex-shrink-0" /> <span>N/A</span>
            </span>
          );
        }
        
        const numValue = parseFloat(value as string);
        if (numValue > 0) {
          return (
            <span className="text-green-500 flex items-center whitespace-nowrap">
              <ArrowUp className="mr-1 h-4 w-4 flex-shrink-0" /> <span>{value}</span>
            </span>
          );
        } else if (numValue < 0) {
          return (
            <span className="text-red-500 flex items-center whitespace-nowrap">
              <ArrowDown className="mr-1 h-4 w-4 flex-shrink-0" /> <span>{value}</span>
            </span>
          );
        } else {
          return (
            <span className="text-blue-500 flex items-center whitespace-nowrap">
              <ArrowRight className="mr-1 h-4 w-4 flex-shrink-0" /> <span>{value}</span>
            </span>
          );
        }
      }
    },
  ], []);

  // Filter the data based on the search input
  const filteredData = useMemo(() => {
    if (!filter) return formattedMetrics;
    
    const lowercaseFilter = filter.toLowerCase();
    return formattedMetrics.filter(row => {
      return (
        row.exercise.toLowerCase().includes(lowercaseFilter) ||
        row.muscleGroup.toLowerCase().includes(lowercaseFilter) ||
        row.date.toLowerCase().includes(lowercaseFilter) ||
        row.howIFeel.toLowerCase().includes(lowercaseFilter)
      );
    });
  }, [formattedMetrics, filter]);

  // Sort the data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    
    return sorted.sort((a, b) => {
      const aValue = a[sortBy.key];
      const bValue = b[sortBy.key];
      
      if (sortBy.key === 'date') {
        // Special handling for date sorting
        return sortBy.direction === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      // Handle string and number comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortBy.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For numeric values
      const numA = typeof aValue === 'number' ? aValue : 0;
      const numB = typeof bValue === 'number' ? bValue : 0;
      
      return sortBy.direction === 'asc' ? numA - numB : numB - numA;
    });
  }, [filteredData, sortBy]);

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  // Handle sorting
  const handleSort = (key: keyof MetricsRow) => {
    setSortBy(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  // Set optimal page size based on device
  React.useEffect(() => {
    // Smaller page sizes on mobile to prevent excessive scrolling
    if (isMobile) {
      setCurrentPage(0); // Reset to first page when switching to mobile
    }
  }, [isMobile]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  if (isLoading) {
    return <Card><CardContent className="pt-6 text-center">Loading workout summary...</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="pt-6 text-center text-red-500">Error: {error}</CardContent></Card>;
  }  return (
    <Card className={`shadow-lg w-full max-w-full overflow-hidden ${isMobile ? 'mobile-optimized' : ''}`}>
      <CardHeader className="pb-3 px-4 sm:px-6 card-header">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Workout Summary</CardTitle>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={() => setFilter('')}
            >
              {filter ? 'Clear Filter' : 'All Data'}
            </Button>
          )}
        </div>
        {isMobile && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              <Info className="inline h-3 w-3 mr-1" /> Swipe horizontally to view more data
            </p>
            {hasOverflow && (
              <div className="flex items-center mt-2 gap-1">
                <div className={`w-2 h-2 rounded-full ${!isScrolledRight ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`w-2 h-2 rounded-full ${isScrolledRight ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
            )}
          </div>
        )}      </CardHeader>
      <CardContent className="p-0">{/* Search Filter */}<div className="p-4 px-4 sm:px-6">
          <div className="flex flex-col space-y-1">
            <label htmlFor="filterInput" className="text-sm font-medium">
              {isMobile ? 'Search' : 'Filter Summary'}
            </label>
            <DebouncedInput
              id="filterInput"
              type="text"
              value={filter}
              onChange={value => setFilter(String(value))}
              placeholder={isMobile ? "Search..." : "Search by exercise, muscle group, date..."}
              className="w-full sm:max-w-sm"
            />
            {filter && isMobile && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {filteredData.length} matching entries
              </p>
            )}
          </div>
        </div>{/* Table with horizontal scroll */}        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`relative table-scroll-container scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20 ${hasOverflow ? 'has-overflow' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%', 
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            overscrollBehaviorX: 'contain',
            scrollSnapType: 'x proximity'
          }}
        >
          {isMobile && hasOverflow && !isScrolledRight && <div className="scroll-indicator" aria-hidden="true" />}
          <div className={`${isMobile ? 'min-w-[500px]' : 'min-w-[800px]'} relative`}>
            <div className="absolute inset-x-0 bottom-0 border-t border-background/10 h-px w-full"></div>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow>                  {columns.map(col => {
                    const classes = [
                      col.responsivePriority > 1 && "hidden sm:table-cell",
                      col.responsivePriority > 2 && "hidden md:table-cell",
                      col.responsivePriority > 3 && "hidden lg:table-cell",
                      col.responsivePriority > 4 && "hidden xl:table-cell",
                    ].filter(Boolean).join(" ");
                    
                    return (                      <TableHead 
                        key={col.accessorKey.toString()} 
                        className={`${classes} whitespace-nowrap px-2 py-2 first:pl-4 last:pr-4`}
                        data-priority={col.responsivePriority}
                      >
                        {col.sortable ? (
                          <div 
                            className="flex items-center cursor-pointer select-none"
                            onClick={() => handleSort(col.accessorKey)}
                          >
                            <span className="mr-1">{col.header}</span>
                            {sortBy.key === col.accessorKey && (
                              sortBy.direction === 'asc' 
                                ? <ArrowDownAZ className="flex-shrink-0 h-4 w-4" />
                                : <ArrowDownZA className="flex-shrink-0 h-4 w-4" />
                            )}
                          </div>
                        ) : (
                          col.header
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => (
                    <TableRow key={`${row.id}-${rowIndex}`} className="hover:bg-muted/50">                      {columns.map(col => {
                        const classes = [
                          col.responsivePriority > 1 && "hidden sm:table-cell",
                          col.responsivePriority > 2 && "hidden md:table-cell",
                          col.responsivePriority > 3 && "hidden lg:table-cell",
                          col.responsivePriority > 4 && "hidden xl:table-cell",
                        ].filter(Boolean).join(" ");
                        
                        const value = row[col.accessorKey];
                          return (                          <TableCell 
                            key={`${row.id}-${col.accessorKey}`} 
                            className={`${classes} px-2 py-2 first:pl-4 last:pr-4`}
                            data-priority={col.responsivePriority}
                          >
                            {isMobile ? (
                              <MobileTableCell 
                                value={value} 
                                accessorKey={col.accessorKey} 
                                type={col.accessorKey === 'progressionRate' ? 'progress' : 'default'} 
                              />
                            ) : (
                              col.render ? col.render(value) : value
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center px-4">
                      <div className="py-8">No workout summary data available</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
          {/* Pagination */}        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Page {currentPage + 1} of {totalPages}{" "}
            <span className="hidden xs:inline">({sortedData.length} total entries)</span>
            {isMobile && (
              <div className="text-xs mt-1 text-muted-foreground/70">
                Showing {pageSize} entries per page
              </div>
            )}
          </div>          <div className="flex items-center space-x-2 sm:space-x-3">
            {isMobile ? (
              // Mobile-optimized pagination with page numbers
              <div className="flex items-center gap-2 pagination">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="h-9 w-9 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Simple page indicator */}
                <div className="px-2 text-sm font-medium">
                  {currentPage + 1}/{totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1 || totalPages === 0}
                  className="h-9 w-9 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Desktop pagination with text
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="h-8 px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1 || totalPages === 0}
                  className="h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutSummaryTable;
