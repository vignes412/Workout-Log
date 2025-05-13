import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import type { WorkoutLogEntry } from '@/types/Workout_Log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableResponsiveContainer } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, ChevronLeft, ChevronRight, SortAsc, SortDesc } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTableResponsive } from '@/hooks/useTableResponsive';
import { cn } from '@/lib/utils';

// Add custom meta type for columns to include responsivePriority
interface ColumnMeta {
  responsivePriority?: number;
}

const columnHelper = createColumnHelper<WorkoutLogEntry>();

const DebouncedInput: React.FC<{
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>> = (
  { value: initialValue, onChange, debounce = 300, ...props }
) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return <Input {...props} value={value} onChange={e => setValue(e.target.value)} />;
};

export const WorkoutLogTable: React.FC = () => {
  const {
    workoutLogs,
    isLoading,
    error,
    fetchWorkoutLogs,
    removeWorkoutLog,
    isDataFetched,
  } = useWorkoutLogStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const isSmallScreen = !useBreakpoint('sm');
  const { tableRef, hasScrolled, isScrollable, handleScroll } = useTableResponsive();
  
  useEffect(() => {
    if (!isDataFetched) {
      fetchWorkoutLogs();
    }
  }, [fetchWorkoutLogs, isDataFetched]);

  const handleEditRow = useCallback((entry: WorkoutLogEntry) => {
    alert(`Edit functionality for ${entry.exercise} on ${entry.date} to be implemented. This will open EditWorkoutLogModal.`);
    console.log('Editing entry (to be passed to modal):', entry);
  }, []);

  const handleDeleteRow = useCallback(async (logId: string, exerciseName: string, date: string) => {
    if (window.confirm(`Are you sure you want to delete the log for ${exerciseName} on ${date}?`)) {
      try {
        await removeWorkoutLog(logId);
      } catch (e) {
        console.error("Failed to delete log:", e);
        alert("Failed to delete log. See console for details.");
      }
    }
  }, [removeWorkoutLog]);

  const columns = useMemo(() => [
    columnHelper.accessor('date', { 
      header: 'Date', 
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
    columnHelper.accessor('muscleGroup', { 
      header: 'Muscle Group', 
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
    columnHelper.accessor('weight', {
      header: 'Weight (kg)',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 2 } as ColumnMeta
    }),
    columnHelper.accessor('reps', {
      header: 'Reps',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 2 } as ColumnMeta
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => info.getValue(),
      enableSorting: true,
      meta: { responsivePriority: 3 } as ColumnMeta
    }),
    columnHelper.accessor('restTime', {
      header: 'Rest Time',
      cell: info => info.getValue() ? `${info.getValue()}s` : '-',
      enableSorting: true,
      meta: { responsivePriority: 3 } as ColumnMeta
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              handleEditRow(row.original);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              handleDeleteRow(row.original.id, row.original.exercise, row.original.date);
            }}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      meta: { responsivePriority: 1 } as ColumnMeta
    }),
  ], [handleDeleteRow, handleEditRow]);

  const table = useReactTable({
    data: workoutLogs,
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
        pageSize: 10,
      },
    },
  });

  if (isLoading) return <Card><CardContent className="pt-4">Loading workout logs...</CardContent></Card>;
  if (error) return <Card><CardContent className="pt-4 text-red-500">Error: {error}</CardContent></Card>;

  return (
    <Card className="shadow-lg w-full max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Workout Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search filter */}
        <div className="p-3 space-y-2">
          <div className="flex flex-col space-y-1">
            <label htmlFor="globalFilterInput" className="text-xs font-medium">Filter Table</label>
            <DebouncedInput
              id="globalFilterInput"
              type="text"
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder="Search across all fields..."
              className="h-9 text-sm"
            />
          </div>
        </div>
        
        {/* Table with horizontal scroll - mobile optimized */}
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
                      const classes = cn(
                        "px-3 py-3",
                        priority > 1 && "hidden sm:table-cell",
                        priority > 2 && "hidden md:table-cell", 
                        priority > 3 && "hidden lg:table-cell"
                      );

                      return (
                        <TableHead key={header.id} className={classes}>
                          {header.isPlaceholder ? null : (
                            <div
                              className={`${header.column.getCanSort() ? 'cursor-pointer select-none' : ''} flex items-center`}
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
                        const classes = cn(
                          "px-3 py-2", // Increased padding for better touch targets
                          priority > 1 && "hidden sm:table-cell",
                          priority > 2 && "hidden md:table-cell",
                          priority > 3 && "hidden lg:table-cell"
                        );

                        return (
                          <TableCell key={cell.id} className={classes}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableResponsiveContainer>
        </div>
        
        {/* Pagination - mobile responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}{" "}
            ({table.getFilteredRowModel().rows.length} row(s))
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-9 px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
