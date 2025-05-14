import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, src, alt = "", fallback, size = 'md', ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    
    const sizeClasses = {
      sm: "h-6 w-6 text-xs",
      md: "h-10 w-10 text-base",
      lg: "h-16 w-16 text-xl",
    }
    
    const getFallback = () => {
      if (fallback) return fallback;
      if (alt && alt.trim() !== "") {
        return alt
          .split(" ")
          .map(word => word[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
      }
      return "U";
    };

    return (
      <span
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground">
            {getFallback()}
          </span>
        )}
      </span>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
