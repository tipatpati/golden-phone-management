import React from "react";
import { FormField } from "@/components/common/FormField";
import { ClientContactInfoProps } from "./types";

export function ClientContactInfo({
  formData,
  onFieldChange,
  getFieldError
}: ClientContactInfoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Email"
          inputType="email"
          value={formData.email || ''}
          onChange={(value) => onFieldChange('email', value)}
          placeholder="client@example.com"
          error={getFieldError('email')}
        />
        <FormField
          label="Phone"
          inputType="tel"
          value={formData.phone || ''}
          onChange={(value) => onFieldChange('phone', value)}
          placeholder="+1 (555) 123-4567"
          error={getFieldError('phone')}
        />
      </div>

      <FormField
        type="textarea"
        label="Address"
        value={formData.address || ''}
        onChange={(value) => onFieldChange('address', value)}
        placeholder="Street address, city, state/province, postal code, country"
        rows={3}
        error={getFieldError('address')}
      />

      <FormField
        label="Tax ID / VAT Number"
        value={formData.tax_id || ''}
        onChange={(value) => onFieldChange('tax_id', value)}
        placeholder="Tax identification number"
        error={getFieldError('tax_id')}
        description="Optional: For business invoicing and tax purposes"
      />

      <FormField
        type="textarea"
        label="Notes"
        value={formData.notes || ''}
        onChange={(value) => onFieldChange('notes', value)}
        placeholder="Additional notes or comments about the client"
        rows={3}
        error={getFieldError('notes')}
      />
    </div>
  );
}