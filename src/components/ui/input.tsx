import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Mobile-friendly height (44px min for touch), desktop 48px
          "flex h-11 sm:h-12 w-full rounded-xl border-0 glass bg-surface-container/50",
          "px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-light",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-on-surface-variant/60 md-motion-smooth",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:bg-surface-container-high/60",
          "disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-container-high/60 backdrop-blur-md",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
