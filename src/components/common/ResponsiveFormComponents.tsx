import React from "react";
import { BaseDialog, FormField } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

interface ResponsiveFormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ResponsiveFormGrid({ 
  children, 
  columns = 2, 
  className = "" 
}: ResponsiveFormGridProps) {
  const gridClasses = {
    1: "grid grid-cols-1 gap-4",
    2: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
    3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
  };

  return (
    <div className={`${gridClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className = "",
  collapsible = false,
  defaultOpen = true
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-foreground">
            {title}
          </h3>
          {collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-auto p-1"
            >
              {isOpen ? "−" : "+"}
            </Button>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {(!collapsible || isOpen) && (
        <>
          <Separator className="my-3" />
          <div className="space-y-4">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function FormActions({ 
  children, 
  className = "",
  sticky = false 
}: FormActionsProps) {
  return (
    <div className={`
      flex flex-col sm:flex-row gap-3 sm:gap-4 
      ${sticky ? "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t" : "pt-4"}
      ${className}
    `}>
      {children}
    </div>
  );
}

interface ResponsiveDialogProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  fullscreen?: boolean;
}

export function ResponsiveDialog({
  title,
  children,
  open,
  onClose,
  onSubmit,
  isLoading = false,
  submitText = "Save",
  cancelText = "Cancel",
  size = "md",
  fullscreen = false
}: ResponsiveDialogProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full mx-4"
  };

  return (
    <BaseDialog
      title={title}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitText={submitText}
      cancelText={cancelText}
      size={size as any}
    >
      <div className={fullscreen ? "min-h-[60vh]" : ""}>
        {children}
      </div>
    </BaseDialog>
  );
}

// Example enhanced form component
interface EnhancedFormExampleProps {
  open: boolean;
  onClose: () => void;
}

export function EnhancedFormExample({ open, onClose }: EnhancedFormExampleProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    description: "",
    priority: "medium"
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ResponsiveDialog
      title="Enhanced Form Example"
      open={open}
      onClose={onClose}
      onSubmit={() => {}}
      size="lg"
    >
      <div className="space-y-6">
        <FormSection 
          title="Basic Information" 
          description="Required fields for contact information"
        >
          <ResponsiveFormGrid columns={2}>
            <FormField
              label="Full Name"
              required
              value={formData.name}
              onChange={(value) => updateField('name', value)}
              placeholder="Enter full name"
            />
            <FormField
              label="Email Address"
              required
              inputType="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              placeholder="Enter email address"
            />
          </ResponsiveFormGrid>
          
          <ResponsiveFormGrid columns={2}>
            <FormField
              label="Phone Number"
              inputType="tel"
              value={formData.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
            />
            <FormField
              type="select"
              label="Category"
              required
              value={formData.category}
              onChange={(value) => updateField('category', value)}
              placeholder="Select category"
              options={[
                { value: "general", label: "General Inquiry" },
                { value: "support", label: "Technical Support" },
                { value: "sales", label: "Sales Question" }
              ]}
            />
          </ResponsiveFormGrid>
        </FormSection>

        <FormSection 
          title="Additional Details"
          description="Optional information and preferences"
          collapsible
          defaultOpen={false}
        >
          <FormField
            type="textarea"
            label="Description"
            value={formData.description}
            onChange={(value) => updateField('description', value)}
            placeholder="Provide additional details..."
            rows={4}
          />
          
          <FormField
            type="select"
            label="Priority Level"
            value={formData.priority}
            onChange={(value) => updateField('priority', value)}
            options={[
              { value: "low", label: "Low Priority" },
              { value: "medium", label: "Medium Priority" },
              { value: "high", label: "High Priority" },
              { value: "urgent", label: "Urgent" }
            ]}
          />
        </FormSection>
      </div>
    </ResponsiveDialog>
  );
}