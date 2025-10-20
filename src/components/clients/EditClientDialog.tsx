import React from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { ClientForm } from "./forms/ClientForm";
import { useUpdateClient, type Client } from "@/services";
import { ClientFormData } from "./forms/types";
import { toast } from "@/components/ui/sonner";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/updated-button";

interface EditClientDialogProps {
  client: Client;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditClientDialog({ client, open: controlledOpen, onOpenChange }: EditClientDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const updateClient = useUpdateClient();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await updateClient.mutateAsync({ 
        id: client.id, 
        data: data 
      });
      
      toast.success("Cliente aggiornato con successo!");
      setOpen(false);
    } catch (error: any) {
      toast.error(`Errore nell'aggiornamento del cliente: ${error.message}`);
    }
  };

  const handleDialogSubmit = async () => {
    // Trigger the form's submit handler via the global reference
    if ((window as any).__currentFormSubmit) {
      await (window as any).__currentFormSubmit();
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

  // If not using controlled state, show a button trigger
  if (controlledOpen === undefined) {
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
          title={`Modifica ${getClientDisplayName()}`}
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleDialogSubmit}
          isLoading={updateClient.isPending}
          submitText="Aggiorna Cliente"
          size="lg"
        >
          <ClientForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={updateClient.isPending}
            submitText="Aggiorna Cliente"
          />
        </FormDialog>
      </>
    );
  }

  // Controlled mode - only show dialog
  return (
    <FormDialog
      title={`Modifica ${getClientDisplayName()}`}
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={handleDialogSubmit}
      isLoading={updateClient.isPending}
      submitText="Aggiorna Cliente"
      size="lg"
    >
      <ClientForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateClient.isPending}
        submitText="Aggiorna Cliente"
      />
    </FormDialog>
  );
}