import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight 
} from 'lucide-react';

interface MobileTableCellProps {
  value: string | number;
  type?: 'progress' | 'default';
  accessorKey: string;
}

/**
 * Mobile-optimized table cell component with special rendering for different value types
 */
export const MobileTableCell: React.FC<MobileTableCellProps> = ({ 
  value,
  type = 'default',
  accessorKey
}) => {
  if (type === 'progress') {
    if (value === "N/A") {
      return (
        <span className="text-blue-500 flex items-center text-xs whitespace-nowrap">
          <ArrowRight className="mr-0.5 h-3 w-3 flex-shrink-0" /> <span>N/A</span>
        </span>
      );
    }
    
    const numValue = parseFloat(value as string);
    if (numValue > 0) {
      return (
        <span className="text-green-500 flex items-center text-xs whitespace-nowrap">
          <ArrowUp className="mr-0.5 h-3 w-3 flex-shrink-0" /> <span>{value}</span>
        </span>
      );
    } else if (numValue < 0) {
      return (
        <span className="text-red-500 flex items-center text-xs whitespace-nowrap">
          <ArrowDown className="mr-0.5 h-3 w-3 flex-shrink-0" /> <span>{value}</span>
        </span>
      );
    } else {
      return (
        <span className="text-blue-500 flex items-center text-xs whitespace-nowrap">
          <ArrowRight className="mr-0.5 h-3 w-3 flex-shrink-0" /> <span>{value}</span>
        </span>
      );
    }
  }
  
  // Format numeric values to be more compact on mobile
  if (typeof value === 'number') {
    // Round to 1 decimal place for readability on small screens
    const formattedValue = Math.abs(value) >= 100 
      ? Math.round(value)
      : Math.abs(value) >= 10 
        ? value.toFixed(1) 
        : value.toFixed(1);
    
    return <span className="text-xs">{formattedValue}</span>;
  }
  
  // If it's the exercise field, truncate long names
  if (accessorKey === 'exercise' && typeof value === 'string' && value.length > 12) {
    return <span className="text-xs" title={value}>{value.substring(0, 11)}…</span>;
  }
  
  return <span className="text-xs">{value}</span>;
};

export default MobileTableCell;
