import React from "react";
import { ClientFormProps } from "./types";
import { ClientBusinessInfo } from "./ClientBusinessInfo";
import { ClientContactInfo } from "./ClientContactInfo";
import { FormField } from "@/components/common/FormField";
import { CLIENT_STATUS_OPTIONS } from "./types";
import { useClientForm } from "./hooks/useClientForm";

export function ClientForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  submitText = "Save Client" 
}: ClientFormProps) {
  const {
    formData,
    isSubmitting,
    updateField,
    handleSubmit,
    getFieldError
  } = useClientForm({ initialData, onSubmit });

  // Expose handleSubmit to parent components
  React.useEffect(() => {
    (window as any).__currentFormSubmit = handleSubmit;
    return () => {
      (window as any).__currentFormSubmit = null;
    };
  }, [handleSubmit]);

  return (
    <div className="space-y-6">
      {/* Business Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Client Information</h3>
        <ClientBusinessInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Details</h3>
        <ClientContactInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Client Status</h3>
        <FormField
          type="select"
          label="Status"
          value={formData.status || 'active'}
          onChange={(value) => updateField('status', value)}
          options={CLIENT_STATUS_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
          required
          error={getFieldError('status')}
          description="Active clients can place orders and access services"
        />
      </div>

      {/* Form-level error display */}
      {getFieldError('form') && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{getFieldError('form')}</p>
        </div>
      )}
    </div>
  );
}