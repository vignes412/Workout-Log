import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing responsive tables with horizontal scrolling
 * @returns An object with refs and state for managing responsive tables
 */
export function useTableResponsive() {
  const tableRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Check if table is scrollable (content wider than container)
  const checkIfScrollable = () => {
    if (tableRef.current) {
      const { scrollWidth, clientWidth } = tableRef.current;
      setIsScrollable(scrollWidth > clientWidth);
    }
  };

  // Track scroll position
  const handleScroll = () => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    
    // Check if we've scrolled to the right edge
    setHasScrolled(scrollLeft + clientWidth >= scrollWidth - 5); // 5px buffer for rounding errors
  };

  // Setup resize observer to check if table becomes scrollable after resize/reflow
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      checkIfScrollable();
      handleScroll(); // Also update scroll position when size changes
    });

    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
      // Initial check
      checkIfScrollable();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return {
    tableRef,
    hasScrolled,
    isScrollable,
    handleScroll,
  };
}
