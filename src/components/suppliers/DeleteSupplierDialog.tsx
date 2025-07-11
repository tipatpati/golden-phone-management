import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "@/services/useSuppliers";

interface DeleteSupplierDialogProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSupplierDialog({ supplier, open, onOpenChange }: DeleteSupplierDialogProps) {
  const { toast } = useToast();
  const { deleteSupplier } = useSuppliers();

  const handleDelete = async () => {
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the supplier "{supplier?.name}"? This action cannot be undone and will affect any related transactions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}