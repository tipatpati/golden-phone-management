
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
          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete sale {sale.sale_number}? This action cannot be undone.
            This will permanently remove the sale record and all associated items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteSale.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteSale.isPending ? "Deleting..." : "Delete Sale"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
