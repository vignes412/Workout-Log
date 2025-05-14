import { useEffect, useState } from 'react';

// Breakpoints that match Tailwind's default breakpoints
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointMap: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Custom hook to check if the current viewport matches a minimum width breakpoint
 * @param breakpoint The minimum breakpoint to check for
 * @returns Boolean indicating if the viewport is at least as wide as the breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    const width = window.innerWidth;
    setMatches(width >= breakpointMap[breakpoint]);

    // Set up the media query
    const mediaQuery = window.matchMedia(
      `(min-width: ${breakpointMap[breakpoint]}px)`
    );
    
    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define our event listener
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add the event listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint]);

  return matches;
}

/**
 * Get the current active breakpoint name
 * @returns The current active breakpoint from 'xs' to '2xl'
 */
export function useActiveBreakpoint(): 'xs' | Breakpoint {
  const sm = useBreakpoint('sm');
  const md = useBreakpoint('md');
  const lg = useBreakpoint('lg');
  const xl = useBreakpoint('xl');
  const xxl = useBreakpoint('2xl');

  if (xxl) return '2xl';
  if (xl) return 'xl';
  if (lg) return 'lg';
  if (md) return 'md';
  if (sm) return 'sm';
  return 'xs';
}
