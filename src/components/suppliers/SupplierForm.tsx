import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useCreateSupplier, useUpdateSupplier } from "@/services";

interface SupplierFormProps {
  supplier?: any;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  contact_person: string;
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
    contact_person: supplier?.contact_person || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    tax_id: supplier?.tax_id || "",
    payment_terms: supplier?.payment_terms || "",
    credit_limit: supplier?.credit_limit?.toString() || "0",
    notes: supplier?.notes || "",
    status: supplier?.status || "active",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_id: formData.tax_id || null,
        payment_terms: formData.payment_terms || null,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        notes: formData.notes || null,
        status: formData.status as "active" | "inactive",
      };

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Supplier Name"
          required
          value={formData.name}
          onChange={(value) => handleChange("name", value)}
        />
        <FormField
          label="Contact Person"
          required
          value={formData.contact_person}
          onChange={(value) => handleChange("contact_person", value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Email"
          inputType="email"
          value={formData.email}
          onChange={(value) => handleChange("email", value)}
        />
        <FormField
          label="Phone"
          inputType="tel"
          value={formData.phone}
          onChange={(value) => handleChange("phone", value)}
        />
      </div>

      <FormField
        type="textarea"
        label="Address"
        value={formData.address}
        onChange={(value) => handleChange("address", value)}
        rows={2}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Tax ID"
          value={formData.tax_id}
          onChange={(value) => handleChange("tax_id", value)}
        />
        <FormField
          label="Credit Limit"
          inputType="number"
          value={formData.credit_limit}
          onChange={(value) => handleChange("credit_limit", value)}
        />
      </div>

      <FormField
        label="Payment Terms"
        value={formData.payment_terms}
        onChange={(value) => handleChange("payment_terms", value)}
        description="e.g., Net 30, 2/10 Net 30"
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
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
        </Button>
      </div>
    </div>
  );
}