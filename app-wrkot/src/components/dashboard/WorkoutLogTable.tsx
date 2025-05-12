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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, ChevronLeft, ChevronRight, SortAsc, SortDesc } from 'lucide-react';

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
  } = useWorkoutLogStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  useEffect(() => {
    fetchWorkoutLogs();
  }, [fetchWorkoutLogs]);

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
    columnHelper.accessor('date', { header: 'Date', cell: info => info.getValue(), enableSorting: true }),
    columnHelper.accessor('muscleGroup', { header: 'Muscle Group', cell: info => info.getValue(), enableSorting: true }),
    columnHelper.accessor('exercise', { header: 'Exercise', cell: info => info.getValue(), enableSorting: true }),
    columnHelper.accessor('reps', { header: 'Reps', cell: info => typeof info.getValue() === 'number' ? info.getValue() : 'N/A', enableSorting: true }),
    columnHelper.accessor('weight', { header: 'Weight', cell: info => typeof info.getValue() === 'number' ? info.getValue() : 'N/A', enableSorting: true }),
    columnHelper.accessor('rating', { header: 'Rating', cell: info => typeof info.getValue() === 'number' ? info.getValue() : 'N/A', enableSorting: true }),
    columnHelper.accessor('restTime', { header: 'Rest (s)', cell: info => info.getValue() ?? 'N/A', enableSorting: true }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-1">
          <Button variant="outline" size="icon" onClick={() => handleEditRow(row.original)}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={() => {
              handleDeleteRow(row.original.id, row.original.exercise, row.original.date);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
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
    <Card className="shadow-lg w-full max-w-full overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-lg">Workout Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-2 space-y-2">
          {/* Global filter input */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="globalFilterInput" className="text-xs font-medium">Filter Table</label>
            <DebouncedInput
              id="globalFilterInput"
              type="text"
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder="Search across all fields..."
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-full text-xs whitespace-nowrap">
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="p-1.5">
                      {header.isPlaceholder ? null : (
                        <div
                          className={`${header.column.getCanSort() ? 'cursor-pointer select-none' : ''} flex items-center`}
                          onClick={header.column.getToggleSortingHandler()}
                          title={header.column.getCanSort() ? 'Sort' : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <SortAsc className="ml-1 h-3 w-3" />,
                            desc: <SortDesc className="ml-1 h-3 w-3" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/50">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="p-1.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center p-1.5">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-2 border-t">
          <div className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}{" "}
            ({table.getFilteredRowModel().rows.length} row(s))
            {table.getFilteredSelectedRowModel().rows.length > 0 &&
              ` (${table.getFilteredSelectedRowModel().rows.length} selected)`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-3 w-3 mr-1" /> Previous
            </Button>
            <span className="text-xs">
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-2"
            >
              Next <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
