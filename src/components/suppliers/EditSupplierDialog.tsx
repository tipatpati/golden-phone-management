import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";

interface EditSupplierDialogProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange }: EditSupplierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <SupplierForm supplier={supplier} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}