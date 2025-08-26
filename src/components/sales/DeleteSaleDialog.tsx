
import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteSale, type Sale } from "@/services";

interface DeleteSaleDialogProps {
  sale: Sale;
}

export function DeleteSaleDialog({ sale }: DeleteSaleDialogProps) {
  const deleteSale = useDeleteSale();

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync(sale.id);
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Elimina Garentille</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare la garentille {sale.sale_number}? Questa azione non può essere annullata.
            Questo rimuoverà permanentemente la registrazione della garentille e tutti gli elementi associati.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteSale.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteSale.isPending ? "Eliminando..." : "Elimina Garentille"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
