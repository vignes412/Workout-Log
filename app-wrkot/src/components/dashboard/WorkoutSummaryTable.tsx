import React, { useEffect, useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableResponsiveContainer } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowRight, ChevronLeft, ChevronRight, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTableResponsive } from '@/hooks/useTableResponsive';
import { cn } from '@/lib/utils';
import { computeDailyMetrics } from '@/utils/computeDailyMetrics';

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

interface MetricsRow {
  id: string;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  averageReps: number;
  averageWeight: number;
  averageFatigue: number;
  maxWeight: number;
  intensity: number;
  fatigue: number;
  howIFeel: string;
  progressionRate: number | string;
}

interface ComputedMetricFromUtil {
  id: number | string;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: string;
  totalSets: number;
  totalReps: string;
  averageReps: string;
  averageWeight: string;
  averageFatigue: string;
  maxWeight: number;
  howIFeel: string;
  intensity: string;
  fatigue: string;
  progressionRate?: string | number;
}

type WorkoutDataTuple = [string, string, string, unknown, unknown, unknown];

interface ColumnMeta {
  responsivePriority?: number;
  className?: string;
}

const columnHelper = createColumnHelper<MetricsRow>();

export const WorkoutSummaryTable: React.FC = () => {
  const { workoutLogs, isLoading, error, isDataFetched, fetchWorkoutLogs } = useWorkoutLogStore();
  const isSmallScreen = !useBreakpoint('sm');
  const { tableRef, hasScrolled, isScrollable, handleScroll } = useTableResponsive();

  useEffect(() => {
    if (!isDataFetched) {
      fetchWorkoutLogs();
    }
  }, [fetchWorkoutLogs, isDataFetched]);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  const logsForCalculation: WorkoutDataTuple[] = useMemo(() => {
    return workoutLogs.map(log => [
      log.date,
      log.muscleGroup,
      log.exercise,
      log.reps,
      log.weight,
      log.rating,
    ] as WorkoutDataTuple);
  }, [workoutLogs]);

  const dailyMetrics: ComputedMetricFromUtil[] = useMemo(() => {
    return computeDailyMetrics(logsForCalculation);
  }, [logsForCalculation]);

  const formattedMetrics: MetricsRow[] = useMemo(() => {
    let idCounter = 0;
    return dailyMetrics.map((row: ComputedMetricFromUtil) => {
      let formattedDate = "Invalid Date";
      try {
        const dateValue = typeof row.date === 'string' ? row.date : String(row.date);
        if (dateValue && dateValue.toLowerCase() !== 'invalid date' && dateValue.length > 0) {
          const parsedDate = new Date(dateValue.includes('T') ? dateValue : dateValue.replace(/-/g, '/'));
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = format(parsedDate, "yyyy-MM-dd");
          }
        }
      } catch (e) {
        console.error(`Error parsing or formatting date "${row.date}":`, e);
      }

      return {
        id: row.id?.toString() || `metric-${idCounter++}`,
        date: formattedDate,
        muscleGroup: row.muscleGroup || "N/A",
        exercise: row.exercise || "N/A",
        totalVolume: parseFloat(row.totalVolume?.toString() || '0'),
        totalSets: parseInt(row.totalSets?.toString() || '0', 10),
        totalReps: parseInt(row.totalReps?.toString() || '0', 10),
        averageReps: parseFloat(row.averageReps?.toString() || '0'),
        averageWeight: parseFloat(row.averageWeight?.toString() || '0'),
        averageFatigue: parseFloat(row.averageFatigue?.toString() || '0'),
        maxWeight: parseFloat(row.maxWeight?.toString() || '0'),
        intensity: parseFloat(row.intensity?.toString() || '0'),
        fatigue: parseFloat(row.fatigue?.toString() || '0'),
        howIFeel: row.howIFeel || "N/A",
        progressionRate: row.progressionRate === "N/A" ? "N/A" : parseFloat(row.progressionRate?.toString() || '0'),
      };
    });
  }, [dailyMetrics]);

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('muscleGroup', {
      header: 'Muscle',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('exercise', {
      header: 'Exercise',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('totalVolume', {
      header: 'Volume',
      cell: info => info.getValue().toLocaleString(),
      enableSorting: true,
      meta: { responsivePriority: 2 } as ColumnMeta
    }),
    columnHelper.accessor('totalSets', {
      header: 'Sets',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('totalReps', {
      header: 'Reps',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 3 } as ColumnMeta
    }),
    columnHelper.accessor('averageReps', {
      header: 'Avg Reps',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 4 } as ColumnMeta
    }),
    columnHelper.accessor('averageWeight', {
      header: 'Avg Wt',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 3 } as ColumnMeta
    }),
    columnHelper.accessor('averageFatigue', {
      header: 'Avg Fatigue',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 4 } as ColumnMeta
    }),
    columnHelper.accessor('maxWeight', {
      header: 'Max Wt',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 3 } as ColumnMeta
    }),
    columnHelper.accessor('intensity', {
      header: 'Int(%)',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 4 } as ColumnMeta
    }),
    columnHelper.accessor('fatigue', {
      header: 'Fatigue (%)',
      cell: info => info.getValue().toFixed(1),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('howIFeel', {
      header: 'Feel',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 5 } as ColumnMeta
    }),
    columnHelper.accessor('progressionRate', {
      header: 'Progress',
      cell: info => {
        const value = info.getValue();
        if (value === "N/A") {
          return (
            <span className="text-blue-500 flex items-center whitespace-nowrap">
              <ArrowRight className="mr-1 h-4 w-4 flex-shrink-0" /> <span>N/A</span>
            </span>
          );
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
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
        }
        return (
          <span className="text-gray-500 flex items-center whitespace-nowrap">
            <ArrowRight className="mr-1 h-4 w-4 flex-shrink-0" /> <span>{value}</span>
          </span>
        );
      },
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
  ], []);

  const table = useReactTable({
    data: formattedMetrics,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (originalRow) => originalRow.id,
    initialState: {
      pagination: {
        pageSize: isSmallScreen ? 5 : 10,
      },
    },
  });

  useEffect(() => {
    table.setPageSize(isSmallScreen ? 5 : 10);
  }, [isSmallScreen, table]);

  if (isLoading) return <Card><CardContent className="pt-4">Loading workout summary...</CardContent></Card>;
  if (error) return <Card><CardContent className="pt-4 text-red-500">Error: {error}</CardContent></Card>;
  if (!isDataFetched && workoutLogs.length === 0) return <Card><CardContent className="pt-4">No data available. Fetching...</CardContent></Card>;

  return (
    <Card className="shadow-lg w-full max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Workout Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-3 space-y-2">
          <div className="flex flex-col space-y-1">
            <label htmlFor="summaryGlobalFilterInput" className="text-xs font-medium">Filter Table</label>
            <DebouncedInput
              id="summaryGlobalFilterInput"
              type="text"
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder="Search across all fields..."
              className="h-9 text-sm"
            />
          </div>
        </div>
        
        <div 
          className={cn(
            "relative mobile-optimized table-scroll-container",
            hasScrolled && "scrolled-right"
          )}
        >
          {isSmallScreen && isScrollable && !hasScrolled && <div className="scroll-indicator" />}
          <TableResponsiveContainer 
            ref={tableRef} 
            onScroll={handleScroll}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30"
          >
            <Table className="w-full text-sm">
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                      const priority = meta?.responsivePriority || 999;
                      const columnClasses = cn(
                        "px-3 py-3 whitespace-nowrap",
                        meta?.className,
                        priority > 1 && "hidden sm:table-cell",
                        priority > 2 && "hidden md:table-cell", 
                        priority > 3 && "hidden lg:table-cell",
                        priority > 4 && "hidden xl:table-cell"
                      );

                      return (
                        <TableHead key={header.id} className={columnClasses}>
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                'flex items-center',
                                header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                              title={header.column.getCanSort() ? 'Sort' : undefined}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <SortAsc className="ml-1 h-4 w-4" />,
                                desc: <SortDesc className="ml-1 h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow 
                      key={row.id} 
                      data-state={row.getIsSelected() && "selected"} 
                      className="hover:bg-muted/50 border-b"
                    >
                      {row.getVisibleCells().map(cell => {
                        const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                        const priority = meta?.responsivePriority || 999;
                        const cellClasses = cn(
                          "px-3 py-2", 
                          meta?.className,
                          priority > 1 && "hidden sm:table-cell",
                          priority > 2 && "hidden md:table-cell",
                          priority > 3 && "hidden lg:table-cell",
                          priority > 4 && "hidden xl:table-cell"
                        );

                        return (
                          <TableCell key={cell.id} className={cellClasses}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableResponsiveContainer>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left mb-2 sm:mb-0">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}{" "}
            ({table.getFilteredRowModel().rows.length} row(s) found)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutSummaryTable;
