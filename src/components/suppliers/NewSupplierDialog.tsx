import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";

interface NewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierDialog({ open, onOpenChange }: NewSupplierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <SupplierForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}