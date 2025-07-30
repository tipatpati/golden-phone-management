import React from "react";
import { BaseDialog } from "@/components/common";
import { SupplierForm } from "./SupplierForm";

interface NewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierDialog({ open, onOpenChange }: NewSupplierDialogProps) {
  return (
    <BaseDialog
      title="Add New Supplier"
      open={open}
      onClose={() => onOpenChange(false)}
      showActions={false} // SupplierForm handles its own actions
      maxWidth="lg"
    >
      <SupplierForm onSuccess={() => onOpenChange(false)} />
    </BaseDialog>
  );
}