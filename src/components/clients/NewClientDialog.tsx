import React, { useState } from "react";
import { Button } from "@/components/ui/updated-button";
import { Plus } from "lucide-react";
import { FormDialog } from "@/components/common/FormDialog";
import { ClientForm } from "./forms/ClientForm";
import { ClientFormData } from "./forms/types";
import { useCreateClient } from "@/services";
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
      
      toast.success("Cliente creato con successo!");
      setOpen(false);
    } catch (error: any) {
      toast.error(`Errore nella creazione del cliente: ${error.message}`);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi Cliente
      </Button>

      <FormDialog
        title="Aggiungi Nuovo Cliente"
        open={open}
        onClose={() => setOpen(false)}
        isLoading={createClient.isPending}
        submitText="Aggiungi Cliente"
        size="lg"
      >
        <ClientForm
          onSubmit={handleSubmit}
          isLoading={createClient.isPending}
          submitText="Aggiungi Cliente"
        />
      </FormDialog>
    </>
  );
}