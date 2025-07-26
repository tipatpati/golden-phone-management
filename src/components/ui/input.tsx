import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-t-md border-0 border-b-2 border-border bg-surface-container px-4 py-4 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:bg-surface-container-high transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:bg-surface-container-high",
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
