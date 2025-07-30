import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { BaseDialog, FormField } from "@/components/common";
import { useUpdateClient, type Client } from "@/services/useClients";

interface EditClientDialogProps {
  client: Client;
}

export const EditClientDialog = ({ client }: EditClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: client.type,
    first_name: client.first_name || "",
    last_name: client.last_name || "",
    company_name: client.company_name || "",
    contact_person: client.contact_person || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    tax_id: client.tax_id || "",
    notes: client.notes || "",
    status: client.status,
  });

  const updateClient = useUpdateClient();

  const handleSubmit = async () => {
    updateClient.mutate(
      { id: client.id, client: formData },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getClientDisplayName = () => {
    return formData.type === "business" 
      ? formData.company_name 
      : `${formData.first_name} ${formData.last_name}`;
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <BaseDialog
        title={`Edit ${getClientDisplayName()}`}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isLoading={updateClient.isPending}
        submitText="Update Client"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              type="select"
              label="Client Type"
              value={formData.type}
              onChange={(value) => handleInputChange("type", value)}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' }
              ]}
            />
            <FormField
              type="select"
              label="Status"
              value={formData.status}
              onChange={(value) => handleInputChange("status", value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>

          {formData.type === "individual" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                required
                value={formData.first_name}
                onChange={(value) => handleInputChange("first_name", value)}
              />
              <FormField
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(value) => handleInputChange("last_name", value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <FormField
                label="Company Name"
                required
                value={formData.company_name}
                onChange={(value) => handleInputChange("company_name", value)}
              />
              <FormField
                label="Contact Person"
                value={formData.contact_person}
                onChange={(value) => handleInputChange("contact_person", value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Email"
              inputType="email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
            />
            <FormField
              label="Phone"
              inputType="tel"
              value={formData.phone}
              onChange={(value) => handleInputChange("phone", value)}
            />
          </div>

          <FormField
            type="textarea"
            label="Address"
            value={formData.address}
            onChange={(value) => handleInputChange("address", value)}
            rows={2}
          />

          <FormField
            label="Tax ID"
            value={formData.tax_id}
            onChange={(value) => handleInputChange("tax_id", value)}
          />

          <FormField
            type="textarea"
            label="Notes"
            value={formData.notes}
            onChange={(value) => handleInputChange("notes", value)}
            rows={3}
          />
        </div>
      </BaseDialog>
    </>
  );
};