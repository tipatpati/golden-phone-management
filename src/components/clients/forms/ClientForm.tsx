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
        <h3 className="text-lg font-medium">Informazioni Cliente</h3>
        <ClientBusinessInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Dettagli Contatto</h3>
        <ClientContactInfo
          formData={formData}
          onFieldChange={updateField}
          getFieldError={getFieldError}
        />
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Stato Cliente</h3>
        <FormField
          type="select"
          label="Stato"
          value={formData.status || 'active'}
          onChange={(value) => updateField('status', value)}
          options={CLIENT_STATUS_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
          required
          error={getFieldError('status')}
          description="I clienti attivi possono effettuare ordini e accedere ai servizi"
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