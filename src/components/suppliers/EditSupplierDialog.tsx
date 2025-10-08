import React from "react";
import { BaseDialog } from "@/components/common";
import { SupplierForm } from "./SupplierForm";

interface EditSupplierDialogProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange }: EditSupplierDialogProps) {
  return (
    <BaseDialog
      title="Edit Supplier"
      open={open}
      onClose={() => onOpenChange(false)}
      showActions={false} // SupplierForm handles its own actions
      size="md"
    >
      <SupplierForm supplier={supplier} onSuccess={() => onOpenChange(false)} />
    </BaseDialog>
  );
}