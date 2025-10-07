import React from "react";
import { UnifiedInventoryLabels } from "../labels/UnifiedInventoryLabels";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Product } from "@/services/inventory/types";

interface BulkPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  isLoading?: boolean;
}

export function BulkPrintDialog({ 
  open, 
  onOpenChange,
  products,
  isLoading = false
}: BulkPrintDialogProps) {
  if (!open) return null;

  const productIds = products.map(p => p.id).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <UnifiedInventoryLabels
          productIds={productIds}
          companyName="GOLDEN PHONE SRL"
          buttonText="Generate and Print Labels"
        />
      </DialogContent>
    </Dialog>
  );
}