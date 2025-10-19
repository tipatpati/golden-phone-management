
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden md-orchestrated-change md-focus-smooth",
  {
    variants: {
      variant: {
        filled: "bg-primary text-primary-foreground md-interactive-smooth md-elevation-smooth hover:md-elevation-2 active:md-elevation-1 md-ripple",
        "filled-tonal": "bg-primary-container text-on-primary-container md-interactive-smooth md-elevation-smooth hover:md-elevation-2 active:md-elevation-1",
        elevated: "bg-surface-container-low text-primary md-interactive-smooth md-elevation-2 hover:md-elevation-3 active:md-elevation-1 border border-border",
        outlined: "border border-border bg-background text-primary md-state-layer-refined",
        text: "text-primary md-state-layer-refined",
        destructive: "bg-destructive text-destructive-foreground md-interactive-smooth md-elevation-smooth hover:md-elevation-2 active:md-elevation-1",
        // Legacy variants for compatibility
        default: "bg-primary text-primary-foreground md-interactive-smooth md-elevation-smooth hover:md-elevation-2 active:md-elevation-1",
        outline: "border border-border bg-background text-primary md-state-layer-refined",
        secondary: "bg-secondary-container text-on-secondary-container md-interactive-smooth md-elevation-smooth hover:md-elevation-2 active:md-elevation-1",
        ghost: "text-primary md-state-layer-refined",
        link: "text-primary underline-offset-4 hover:underline md-motion-smooth",
      },
      size: {
        default: "h-11 sm:h-10 px-5 sm:px-6 py-2 text-base sm:text-sm",  /* 44dp mobile (touch-friendly), 40dp desktop */
        sm: "h-10 sm:h-9 rounded-full px-3 sm:px-4 text-sm",  /* 40dp mobile, 36dp desktop */
        lg: "h-12 rounded-full px-6 sm:px-8 text-base",  /* 48dp height */
        icon: "h-11 w-11 sm:h-10 sm:w-10",  /* 44dp mobile (touch-friendly), 40dp desktop */
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      // Ensure button is enabled and not loading
      if (props.disabled) {
        event.preventDefault();
        return;
      }
      
      // Call the original onClick handler
      props.onClick?.(event);
    }, [props.onClick, props.disabled]);

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        onClick={asChild ? props.onClick : handleClick}
        style={{ 
          ...props.style,
          cursor: props.disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
