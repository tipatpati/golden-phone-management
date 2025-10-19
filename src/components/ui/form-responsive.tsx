import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Responsive Form Layout Components
 * Mobile-first form layouts that adapt to screen size
 */

interface ResponsiveFormProps {
  children: React.ReactNode
  className?: string
}

/**
 * Form container with responsive padding
 */
export const ResponsiveForm = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, children, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-4 sm:space-y-6", className)}
    {...props}
  >
    {children}
  </form>
))
ResponsiveForm.displayName = "ResponsiveForm"

/**
 * Form row that stacks on mobile, inline on desktop
 */
export const FormRow: React.FC<ResponsiveFormProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
    className
  )}>
    {children}
  </div>
)

/**
 * Form row with 3 columns on desktop
 */
export const FormRow3Col: React.FC<ResponsiveFormProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
    className
  )}>
    {children}
  </div>
)

/**
 * Form field wrapper with proper spacing
 */
export const FormField: React.FC<ResponsiveFormProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn("space-y-2", className)}>
    {children}
  </div>
)

/**
 * Form label with responsive sizing
 */
export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm sm:text-base font-medium text-foreground",
      // Ensure minimum touch target for labels with clickable elements
      "block",
      className
    )}
    {...props}
  >
    {children}
  </label>
))
FormLabel.displayName = "FormLabel"

/**
 * Form actions (buttons) that stack on mobile
 */
export const FormActions: React.FC<ResponsiveFormProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    "flex flex-col-reverse sm:flex-row gap-3 sm:gap-4",
    "pt-4 sm:pt-6",
    // Full-width buttons on mobile
    "[&>button]:w-full sm:[&>button]:w-auto",
    className
  )}>
    {children}
  </div>
)

/**
 * Form section with heading and description
 */
interface FormSectionProps extends ResponsiveFormProps {
  title?: string
  description?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title,
  description,
  children, 
  className 
}) => (
  <div className={cn("space-y-4 sm:space-y-6", className)}>
    {(title || description) && (
      <div className="space-y-2">
        {title && (
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    )}
    <div className="space-y-4 sm:space-y-6">
      {children}
    </div>
  </div>
)
