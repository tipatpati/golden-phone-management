import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { debugError } from '@/utils/debug';

/**
 * Field configuration for form dialogs
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Configuration for creating a form dialog
 */
export interface FormDialogConfig<T extends z.ZodType<any, any>> {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  validationSchema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  submitButtonText?: string;
  cancelButtonText?: string;
}

/**
 * Props for the created form dialog component
 */
export interface FormDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<T>;
  isLoading?: boolean;
}

/**
 * Factory function to create reusable form dialogs
 *
 * Usage:
 * ```tsx
 * const EditClientDialog = createFormDialog({
 *   title: "Edit Client",
 *   description: "Update client information",
 *   fields: [
 *     { name: "name", label: "Name", type: "text", required: true },
 *     { name: "email", label: "Email", type: "email", required: true },
 *     { name: "phone", label: "Phone", type: "text" },
 *   ],
 *   validationSchema: z.object({
 *     name: z.string().min(1, "Name is required"),
 *     email: z.string().email("Invalid email"),
 *     phone: z.string().optional(),
 *   }),
 *   onSubmit: async (data) => {
 *     await updateClient(data);
 *   }
 * });
 *
 * // Then use it:
 * <EditClientDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialData={client}
 * />
 * ```
 */
export function createFormDialog<T extends z.ZodType<any, any>>(
  config: FormDialogConfig<T>
) {
  type FormData = z.infer<T>;

  return function FormDialog({
    open,
    onOpenChange,
    initialData,
    isLoading: externalLoading = false
  }: FormDialogProps<FormData>) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<FormData>({
      resolver: zodResolver(config.validationSchema),
      defaultValues: initialData as any,
    });

    // Reset form when dialog opens with new data
    React.useEffect(() => {
      if (open && initialData) {
        form.reset(initialData as any);
      }
    }, [open, initialData, form]);

    const handleSubmit = async (data: FormData) => {
      setIsSubmitting(true);
      try {
        await config.onSubmit(data);
        toast({
          title: "Success",
          description: "Changes saved successfully",
        });
        onOpenChange(false);
        form.reset();
      } catch (error) {
        debugError('Form submission error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save changes",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const renderField = (fieldConfig: FormFieldConfig) => {
      return (
        <FormField
          key={fieldConfig.name}
          control={form.control}
          name={fieldConfig.name as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {fieldConfig.label}
                {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
              <FormControl>
                {fieldConfig.type === 'textarea' ? (
                  <Textarea
                    placeholder={fieldConfig.placeholder}
                    disabled={fieldConfig.disabled || isSubmitting || externalLoading}
                    {...field}
                  />
                ) : fieldConfig.type === 'select' ? (
                  <Select
                    value={field.value?.toString()}
                    onValueChange={field.onChange}
                    disabled={fieldConfig.disabled || isSubmitting || externalLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={fieldConfig.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldConfig.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldConfig.type === 'checkbox' ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={fieldConfig.disabled || isSubmitting || externalLoading}
                    />
                  </div>
                ) : (
                  <Input
                    type={fieldConfig.type}
                    placeholder={fieldConfig.placeholder}
                    disabled={fieldConfig.disabled || isSubmitting || externalLoading}
                    {...field}
                    value={field.value ?? ''}
                  />
                )}
              </FormControl>
              {fieldConfig.description && (
                <FormDescription>{fieldConfig.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            {config.description && (
              <DialogDescription>{config.description}</DialogDescription>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {config.fields.map(renderField)}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                  }}
                  disabled={isSubmitting || externalLoading}
                >
                  {config.cancelButtonText || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || externalLoading}
                >
                  {isSubmitting ? 'Saving...' : (config.submitButtonText || 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };
}

/**
 * Pre-configured dialog for common CRUD operations
 */
export const createCrudDialogs = <T extends z.ZodType<any, any>>(
  entityName: string,
  fields: FormFieldConfig[],
  validationSchema: T,
  {
    onCreate,
    onUpdate,
    onDelete
  }: {
    onCreate?: (data: z.infer<T>) => Promise<void>;
    onUpdate?: (data: z.infer<T>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
  }
) => {
  return {
    Create: onCreate
      ? createFormDialog({
          title: `New ${entityName}`,
          description: `Create a new ${entityName.toLowerCase()}`,
          fields,
          validationSchema,
          onSubmit: onCreate,
          submitButtonText: 'Create',
        })
      : null,

    Edit: onUpdate
      ? createFormDialog({
          title: `Edit ${entityName}`,
          description: `Update ${entityName.toLowerCase()} information`,
          fields,
          validationSchema,
          onSubmit: onUpdate,
          submitButtonText: 'Update',
        })
      : null,

    // Delete dialog would be a simpler confirmation dialog
    // Implementation would use a separate component
  };
};

/**
 * Example usage configurations
 */

// Client Dialog Example
export const clientFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'address', label: 'Address', type: 'textarea' },
];

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Product Dialog Example
export const productFormFields: FormFieldConfig[] = [
  { name: 'brand', label: 'Brand', type: 'text', required: true },
  { name: 'model', label: 'Model', type: 'text', required: true },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'stock', label: 'Stock', type: 'number', required: true },
  { name: 'has_serial', label: 'Track Serial Numbers', type: 'checkbox' },
];

export const productSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be a positive integer'),
  has_serial: z.boolean().optional(),
});
