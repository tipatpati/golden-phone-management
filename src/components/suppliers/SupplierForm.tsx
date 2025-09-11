import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useCreateSupplier, useUpdateSupplier } from "@/services";
import { useClickHandler } from "@/hooks/useClickHandler";

interface SupplierFormProps {
  supplier?: any;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  payment_terms: string;
  credit_limit: string;
  notes: string;
  status: "active" | "inactive";
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const { toast } = useToast();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const [formData, setFormData] = useState<FormData>({
    name: supplier?.name || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    tax_id: supplier?.tax_id || "",
    payment_terms: supplier?.payment_terms || "",
    credit_limit: supplier?.credit_limit?.toString() || "0",
    notes: supplier?.notes || "",
    status: supplier?.status || "active",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormData]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Supplier name is required";
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (basic check for digits and common characters)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Credit limit validation
    const creditLimit = parseFloat(formData.credit_limit);
    if (isNaN(creditLimit) || creditLimit < 0) {
      newErrors.credit_limit = "Credit limit must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = React.useCallback(async () => {
    console.log('SupplierForm handleSubmit called');
    
    if (isLoading) {
      console.log('Already loading, skipping submission');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed');
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        tax_id: formData.tax_id.trim() || null,
        payment_terms: formData.payment_terms.trim() || null,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        notes: formData.notes.trim() || null,
        status: formData.status as "active" | "inactive",
      };

      console.log('Submitting supplier data:', submissionData);

      if (supplier) {
        await updateSupplier.mutateAsync({ 
          id: supplier.id, 
          data: submissionData
        });
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        await createSupplier.mutateAsync(submissionData);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error('Supplier operation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save supplier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, supplier, validateForm, createSupplier, updateSupplier, onSuccess, toast]);

  const isFormValid = React.useMemo(() => {
    return formData.name.trim() && 
      (!formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) &&
      (!formData.phone || /^[\d\s\-\+\(\)]+$/.test(formData.phone)) &&
      !isNaN(parseFloat(formData.credit_limit)) &&
      parseFloat(formData.credit_limit) >= 0;
  }, [formData]);

  const optimizedSubmit = useClickHandler(handleSubmit, {
    debounceMs: 500,
    preventDefault: true,
    disabled: isLoading || !isFormValid
  });

  const getFieldError = (field: keyof FormData) => errors[field];

  return (
    <div className="space-y-4">
      <FormField
        label="Supplier Name"
        required
        value={formData.name}
        onChange={(value) => handleChange("name", value)}
        error={getFieldError("name")}
        placeholder="Enter supplier name"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Email"
          inputType="email"
          value={formData.email}
          onChange={(value) => handleChange("email", value)}
          error={getFieldError("email")}
          placeholder="supplier@company.com"
        />
        <FormField
          label="Phone"
          inputType="tel"
          value={formData.phone}
          onChange={(value) => handleChange("phone", value)}
          error={getFieldError("phone")}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <FormField
        type="textarea"
        label="Address"
        value={formData.address}
        onChange={(value) => handleChange("address", value)}
        rows={2}
        placeholder="Enter supplier address"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Tax ID"
          value={formData.tax_id}
          onChange={(value) => handleChange("tax_id", value)}
          placeholder="Tax identification number"
        />
        <FormField
          label="Credit Limit"
          inputType="number"
          value={formData.credit_limit}
          onChange={(value) => handleChange("credit_limit", value)}
          error={getFieldError("credit_limit")}
          placeholder="0.00"
        />
      </div>

      <FormField
        label="Payment Terms"
        value={formData.payment_terms}
        onChange={(value) => handleChange("payment_terms", value)}
        description="e.g., Net 30, 2/10 Net 30"
        placeholder="Net 30"
      />

      <FormField
        type="select"
        label="Status"
        value={formData.status}
        onChange={(value) => handleChange("status", value)}
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />

      <FormField
        type="textarea"
        label="Notes"
        value={formData.notes}
        onChange={(value) => handleChange("notes", value)}
        rows={3}
        placeholder="Additional notes about the supplier"
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          onClick={optimizedSubmit}
          disabled={isLoading || !isFormValid}
          className="min-w-[120px]"
          type="button"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            supplier ? "Update Supplier" : "Create Supplier"
          )}
        </Button>
      </div>
    </div>
  );
}