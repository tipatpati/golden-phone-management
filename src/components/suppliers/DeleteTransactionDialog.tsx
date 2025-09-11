import React, { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteSupplierTransaction } from "@/services/suppliers/SupplierTransactionService";
import { toast } from "sonner";

interface SupplierTransaction {
  id: string;
  transaction_number: string;
  type: string;
  status: string;
  total_amount: number;
  suppliers?: {
    name: string;
  };
}

interface DeleteTransactionDialogProps {
  transaction: SupplierTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const { userRole } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTransaction = useDeleteSupplierTransaction();

  // Only super admins can delete transactions
  if (userRole !== 'super_admin') {
    return null;
  }

  if (!transaction) return null;

  const handleDelete = async () => {
    if (!transaction) return;
    
    setIsDeleting(true);
    
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      toast.success('Transaction deleted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete transaction {transaction.transaction_number}? 
            This action cannot be undone and will permanently remove the transaction record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}