import { z } from 'zod';

/**
 * Runtime validation schemas using Zod for API responses and form data
 */

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'inventory_manager', 'salesperson', 'technician']),
  created_at: z.string(),
  updated_at: z.string(),
});

// Product schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  threshold: z.number().int().min(0, 'Threshold cannot be negative'),
  category_id: z.number().int().positive().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  battery_level: z.number().int().min(0).max(100).optional(),
  has_serial: z.boolean(),
  serial_numbers: z.array(z.string()).optional(),
  barcode: z.string().optional(),
  supplier: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Client schemas
export const ClientSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['individual', 'business']),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  created_at: z.string(),
  updated_at: z.string(),
}).refine(
  (data) => {
    // Individual clients must have first_name and last_name
    if (data.type === 'individual') {
      return data.first_name && data.last_name;
    }
    // Business clients must have company_name
    if (data.type === 'business') {
      return data.company_name;
    }
    return true;
  },
  {
    message: 'Individual clients require first and last name, business clients require company name',
    path: ['type'],
  }
);

export const CreateClientSchema = z.object({
  type: z.enum(['individual', 'business']),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
}).refine(
  (data) => {
    if (data.type === 'individual') {
      return data.first_name && data.last_name;
    }
    if (data.type === 'business') {
      return data.company_name;
    }
    return true;
  },
  {
    message: 'Individual clients require first and last name, business clients require company name',
    path: ['type'],
  }
);

// Sale schemas
export const SaleItemSchema = z.object({
  id: z.string().uuid(),
  sale_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
  total_price: z.number().positive('Total price must be positive'),
  serial_number: z.string().optional(),
  created_at: z.string(),
});

export const SaleSchema = z.object({
  id: z.string().uuid(),
  sale_number: z.string(),
  client_id: z.string().uuid().optional(),
  salesperson_id: z.string().uuid(),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  tax_amount: z.number().min(0, 'Tax amount cannot be negative'),
  total_amount: z.number().positive('Total amount must be positive'),
  sale_date: z.string(),
  status: z.enum(['completed', 'pending', 'cancelled', 'refunded']),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  items: z.array(SaleItemSchema).optional(),
});

export const CreateSaleSchema = z.object({
  client_id: z.string().uuid().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(),
    serial_number: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

// Form validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Validation helpers
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Export types for use in components
export type ProductFormData = z.infer<typeof CreateProductSchema>;
export type ClientFormData = z.infer<typeof CreateClientSchema>;
export type SaleFormData = z.infer<typeof CreateSaleSchema>;
export type LoginFormData = z.infer<typeof LoginSchema>;