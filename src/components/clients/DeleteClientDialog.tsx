
import React, { useState } from "react";
import { Button } from "@/components/ui/updated-button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useDeleteClient, type Client } from "@/services";
import { Trash2 } from "lucide-react";

interface DeleteClientDialogProps {
  client: Client;
}

export const DeleteClientDialog = ({ client }: DeleteClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const deleteClient = useDeleteClient();

  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      setOpen(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Delete failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Elimina Cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare il cliente "{getClientDisplayName(client)}"? 
            Questa azione non può essere annullata e rimuoverà permanentemente tutti i dati del cliente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteClient.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteClient.isPending ? "Eliminazione..." : "Elimina Cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
