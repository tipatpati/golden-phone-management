import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "./card"

/**
 * Responsive Table Wrapper
 * Automatically switches between table and card layout based on screen size
 */

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  /**
   * Breakpoint at which to switch from cards to table
   * @default "lg"
   */
  breakpoint?: "sm" | "md" | "lg" | "xl"
}

export const ResponsiveTableWrapper = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ children, className, breakpoint = "lg" }, ref) => {
  const breakpointClass = {
    sm: "sm:block",
    md: "md:block",
    lg: "lg:block",
    xl: "xl:block"
  }[breakpoint]

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {/* Horizontal scroll wrapper for desktop tables */}
      <div className={cn("hidden", breakpointClass, "overflow-x-auto")}>
        <div className="min-w-full inline-block align-middle">
          {children}
        </div>
      </div>
      
      {/* Mobile card view placeholder - implement in parent component */}
      <div className={cn("block", breakpointClass.replace("block", "hidden"))}>
        {/* Parent should provide mobile card layout */}
      </div>
    </div>
  )
})
ResponsiveTableWrapper.displayName = "ResponsiveTableWrapper"

/**
 * Mobile-friendly Card alternative to table rows
 */
interface MobileTableCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export const MobileTableCard = React.forwardRef<
  HTMLDivElement,
  MobileTableCardProps
>(({ children, onClick, className }, ref) => (
  <Card 
    ref={ref}
    variant="outlined" 
    interactive={!!onClick}
    onClick={onClick}
    className={cn("mb-3", className)}
  >
    <CardContent className="p-4">
      {children}
    </CardContent>
  </Card>
))
MobileTableCard.displayName = "MobileTableCard"

/**
 * Mobile table row - displays label and value in a row
 */
interface MobileTableRowProps {
  label: string
  value: React.ReactNode
  className?: string
}

export const MobileTableRow: React.FC<MobileTableRowProps> = ({ 
  label, 
  value, 
  className 
}) => (
  <div className={cn("flex justify-between items-center py-2 border-b last:border-b-0", className)}>
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
)
