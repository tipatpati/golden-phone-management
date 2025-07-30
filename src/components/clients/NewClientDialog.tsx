import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { BaseDialog, FormField } from "@/components/common";
import { useCreateClient } from "@/services/useClients";
import { useForm } from "@/hooks/useForm";
import { CreateClientSchema, ClientFormData } from "@/schemas/validation";
import { useErrorHandler } from "@/utils/errorHandler";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  
  const createClient = useCreateClient();
  const { handleError } = useErrorHandler('NewClientDialog');
  
  // Form with validation
  const form = useForm<ClientFormData>(
    {
      type: 'individual',
      first_name: '',
      last_name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      notes: '',
      status: 'active'
    },
    CreateClientSchema,
    'NewClientDialog'
  );

  const handleSubmit = async () => {
    await form.handleSubmit(
      async (data) => {
        await createClient.mutateAsync({
          ...data,
          type: data.type as 'individual' | 'business',
          status: data.status || 'active'
        });
        setOpen(false);
      },
      () => {
        // Success - form automatically resets
      },
      (error) => {
        handleError(error, 'createClient');
      }
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Client
      </Button>

      <BaseDialog
        title="Add New Client"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createClient.isPending}
        submitText="Add Client"
        maxWidth="2xl"
      >
        <Tabs value={form.data.type} onValueChange={(value) => form.updateField('type', value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual (B2C)</TabsTrigger>
            <TabsTrigger value="business">Business (B2B)</TabsTrigger>
          </TabsList>
          
          <div className="space-y-6 mt-6">
            <TabsContent value="individual" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  label="First Name"
                  required
                  value={form.data.first_name || ''}
                  onChange={(value) => form.updateField('first_name', value)}
                  error={form.getFieldError('first_name')}
                />
                <FormField
                  label="Last Name"
                  required
                  value={form.data.last_name || ''}
                  onChange={(value) => form.updateField('last_name', value)}
                  error={form.getFieldError('last_name')}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-6 mt-0">
              <div className="space-y-4">
                <FormField
                  label="Company Name"
                  required
                  value={form.data.company_name || ''}
                  onChange={(value) => form.updateField('company_name', value)}
                  error={form.getFieldError('company_name')}
                />
                <FormField
                  label="Contact Person"
                  value={form.data.contact_person || ''}
                  onChange={(value) => form.updateField('contact_person', value)}
                  error={form.getFieldError('contact_person')}
                />
              </div>
            </TabsContent>

            {/* Common fields for both types */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  label="Email"
                  inputType="email"
                  value={form.data.email || ''}
                  onChange={(value) => form.updateField('email', value)}
                  error={form.getFieldError('email')}
                />
                <FormField
                  label="Phone"
                  inputType="tel"
                  value={form.data.phone || ''}
                  onChange={(value) => form.updateField('phone', value)}
                  error={form.getFieldError('phone')}
                />
              </div>

              <FormField
                type="textarea"
                label="Address"
                value={form.data.address || ''}
                onChange={(value) => form.updateField('address', value)}
                error={form.getFieldError('address')}
                rows={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  label="Tax ID"
                  value={form.data.tax_id || ''}
                  onChange={(value) => form.updateField('tax_id', value)}
                  error={form.getFieldError('tax_id')}
                />
                <FormField
                  type="select"
                  label="Status"
                  value={form.data.status || 'active'}
                  onChange={(value) => form.updateField('status', value)}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  error={form.getFieldError('status')}
                />
              </div>

              <FormField
                type="textarea"
                label="Notes"
                value={form.data.notes || ''}
                onChange={(value) => form.updateField('notes', value)}
                error={form.getFieldError('notes')}
                rows={3}
                description="Additional notes or comments about the client"
              />
            </div>
          </div>
        </Tabs>
      </BaseDialog>
    </>
  );
}