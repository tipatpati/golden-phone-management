import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormDialog } from "@/components/common/FormDialog";
import { ClientForm } from "./forms/ClientForm";
import { ClientFormData } from "./forms/types";
import { useCreateClient } from "@/services/useClients";
import { toast } from "@/components/ui/sonner";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  const createClient = useCreateClient();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await createClient.mutateAsync({
        ...data,
        type: data.type as 'individual' | 'business',
        status: data.status || 'active'
      });
      
      toast.success("Client created successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create client: ${error.message}`);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Client
      </Button>

      <FormDialog
        title="Add New Client"
        open={open}
        onClose={() => setOpen(false)}
        isLoading={createClient.isPending}
        submitText="Add Client"
        maxWidth="2xl"
      >
        <ClientForm
          onSubmit={handleSubmit}
          isLoading={createClient.isPending}
          submitText="Add Client"
        />
      </FormDialog>
    </>
  );
}