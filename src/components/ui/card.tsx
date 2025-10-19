
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'elevated' | 'filled' | 'outlined'
    interactive?: boolean
  }
>(({ className, variant = 'filled', interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base Material Design Card styles
      "rounded-xl bg-surface-container text-on-surface overflow-hidden md-enter-refined md-elevation-smooth",
      // Variant styles
      variant === 'elevated' && "md-elevation-1 hover:md-elevation-3",
      variant === 'filled' && "bg-surface-container-highest",
      variant === 'outlined' && "border border-border bg-surface",
      // Interactive states
      interactive && "cursor-pointer md-interactive-smooth md-state-layer-refined md-focus-smooth",
      // State layer for interactions
      interactive && "relative overflow-hidden",
      className
    )}
    style={{
      ...(variant === 'elevated' && { boxShadow: 'var(--elevation-1)' }),
    }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-4 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    variant?: 'headline' | 'title' | 'subtitle'
  }
>(({ className, variant = 'title', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-medium leading-tight tracking-normal",
      variant === 'headline' && "text-2xl font-semibold",
      variant === 'title' && "text-xl font-medium",
      variant === 'subtitle' && "text-lg font-normal",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-on-surface-variant leading-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 pb-4 sm:px-6 sm:pb-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-2 px-4 pb-4 sm:px-6 sm:pb-6",
      // Mobile: full-width buttons
      "[&>button]:w-full sm:[&>button]:w-auto",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
