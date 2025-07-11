import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";

interface NewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Supplier Transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}