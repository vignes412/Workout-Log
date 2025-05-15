import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useCallback } from "react"
import { useAppStore, ViewType } from "@/store/appStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Router utility functions
export function useRouter() {
  const { setCurrentView } = useAppStore()
  
  const push = useCallback((path: string) => {
    const routes: Record<string, ViewType> = {
      '/': 'dashboard',
      '/workout': 'workout', 
      '/templates': 'templates',
      '/exercises': 'exercises',
      '/settings': 'settings',
      '/stats': 'stats',
      '/profile': 'profile'
    }
    
    if (routes[path]) {
      setCurrentView(routes[path])
    } else {
      console.error(`Route not found: ${path}`)
    }
  }, [setCurrentView])
  
  return { push }
}
