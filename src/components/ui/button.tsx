
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        filled: "bg-primary text-primary-foreground shadow-md hover:shadow-lg active:shadow-sm",
        "filled-tonal": "bg-primary-container text-on-primary-container shadow-sm hover:shadow-md active:shadow-sm",
        elevated: "bg-surface-container-low text-primary shadow-md hover:shadow-lg active:shadow-sm border border-border",
        outlined: "border border-border bg-background text-primary hover:bg-primary/5 active:bg-primary/10",
        text: "text-primary hover:bg-primary/5 active:bg-primary/10",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg active:shadow-sm",
        // Legacy variants for compatibility
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg active:shadow-sm",
        outline: "border border-border bg-background text-primary hover:bg-primary/5 active:bg-primary/10", // Same as outlined for backward compatibility
        secondary: "bg-secondary-container text-on-secondary-container shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "text-primary hover:bg-primary/5 active:bg-primary/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",  /* 40dp height, 24dp horizontal padding */
        sm: "h-8 rounded-full px-4",  /* 32dp height, 16dp horizontal padding */
        lg: "h-12 rounded-full px-8",  /* 48dp height, 32dp horizontal padding */
        icon: "h-10 w-10",  /* 40dp square */
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
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; size: number; id: number }>>([]);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      const newRipple = { x, y, size, id: Date.now() };

      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!asChild) createRipple(event);
      props.onClick?.(event);
    };

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        onClick={asChild ? props.onClick : handleClick}
      >
        {children}
        {!asChild && (
          <div className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute bg-current opacity-20 rounded-full animate-ping"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
