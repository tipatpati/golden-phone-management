export interface ClientFormData {
  type: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface ClientFormValidationError {
  field: string;
  message: string;
}

export interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
}

export interface ClientContactInfoProps {
  formData: Partial<ClientFormData>;
  onFieldChange: (field: keyof ClientFormData, value: any) => void;
  getFieldError: (field: string) => string | undefined;
}

export interface ClientBusinessInfoProps {
  formData: Partial<ClientFormData>;
  onFieldChange: (field: keyof ClientFormData, value: any) => void;
  getFieldError: (field: string) => string | undefined;
}

export const CLIENT_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual (B2C)' },
  { value: 'business', label: 'Business (B2B)' }
] as const;

export const CLIENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
] as const;