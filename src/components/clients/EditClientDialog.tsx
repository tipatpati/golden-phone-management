import React from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { ClientForm } from "./forms/ClientForm";
import { useUpdateClient, type Client } from "@/services/useClients";
import { ClientFormData } from "./forms/types";
import { toast } from "@/components/ui/sonner";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditClientDialogProps {
  client: Client;
}

export function EditClientDialog({ client }: EditClientDialogProps) {
  const [open, setOpen] = React.useState(false);
  const updateClient = useUpdateClient();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await updateClient.mutateAsync({ 
        id: client.id, 
        client: data 
      });
      
      toast.success("Client updated successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update client: ${error.message}`);
    }
  };

  const getClientDisplayName = () => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  // Convert client to initial form data
  const initialData: Partial<ClientFormData> = {
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

      <FormDialog
        title={`Edit ${getClientDisplayName()}`}
        open={open}
        onClose={() => setOpen(false)}
        isLoading={updateClient.isPending}
        submitText="Update Client"
        maxWidth="2xl"
      >
        <ClientForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={updateClient.isPending}
          submitText="Update Client"
        />
      </FormDialog>
    </>
  );
}