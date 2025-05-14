import { useState, useEffect } from 'react';

interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook that returns boolean values for various breakpoints
 * @returns Object with boolean values for each breakpoint and device type
 */
export function useBreakpointValue(): BreakpointValues {
  const [breakpoints, setBreakpoints] = useState<BreakpointValues>({
    xs: false, // < 640px
    sm: false, // >= 640px
    md: false, // >= 768px
    lg: false, // >= 1024px
    xl: false, // >= 1280px
    '2xl': false, // >= 1536px
    isMobile: false, // < 640px
    isTablet: false, // >= 640px and < 1024px
    isDesktop: false, // >= 1024px
  });

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        xs: width < 640,
        sm: width >= 640,
        md: width >= 768,
        lg: width >= 1024,
        xl: width >= 1280,
        '2xl': width >= 1536,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    // Check breakpoints on initial load
    checkBreakpoints();

    // Add listener for resize events
    window.addEventListener('resize', checkBreakpoints);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return breakpoints;
}

export default useBreakpointValue;
