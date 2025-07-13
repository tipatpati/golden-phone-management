
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "glow-button font-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "[--glow-color:#1e9bff]",
        destructive: "[--glow-color:#ff1867]",
        outline: "[--glow-color:#6eff3e]",
        secondary: "[--glow-color:#9ca3af]",
        ghost: "[--glow-color:#8b5cf6]",
        link: "[--glow-color:#06b6d4]",
        success: "[--glow-color:#10b981]",
        warning: "[--glow-color:#f59e0b]",
      },
      size: {
        default: "",
        sm: "!text-sm !px-4 !py-2 !min-h-[36px]",
        lg: "!text-lg !px-8 !py-4 !min-h-[52px]",
        icon: "!p-3 !min-w-[44px] !min-h-[44px] !text-base",
      },
    },
    defaultVariants: {
      variant: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="button-text">{children}</span>
        <i className="button-effects"></i>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
