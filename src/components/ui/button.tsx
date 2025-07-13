
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-decoration-none uppercase letter-spacing-wider font-normal transition-all duration-500 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.blue.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        destructive: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.red.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        outline: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.purple.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        secondary: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.gray.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        ghost: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.indigo.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        link: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.cyan.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        success: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.green.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
        warning: "bg-white text-white px-8 py-3 hover:letter-spacing-widest [--glow-color:theme(colors.orange.500)] hover:shadow-[0_0_35px_var(--glow-color)] hover:bg-[var(--glow-color)] hover:text-[var(--glow-color)] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:z-0 after:content-[''] after:absolute after:inset-0 after:block",
      },
      size: {
        default: "h-auto text-base",
        sm: "h-auto text-sm px-6 py-2",
        lg: "h-auto text-lg px-10 py-4",
        icon: "h-12 w-12 p-0",
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
        <span className="relative z-10">{children}</span>
        <i className="absolute inset-0 block before:content-[''] before:absolute before:top-0 before:left-[80%] before:w-[10px] before:h-[4px] before:bg-background before:transform before:translate-x-[-50%] before:skew-x-[-35deg] before:transition-all before:duration-500 hover:before:w-[20px] hover:before:left-[20%] after:content-[''] after:absolute after:bottom-0 after:left-[20%] after:w-[10px] after:h-[4px] after:bg-background after:transform after:translate-x-[-50%] after:skew-x-[-35deg] after:transition-all after:duration-500 hover:after:w-[20px] hover:after:left-[80%]"></i>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
