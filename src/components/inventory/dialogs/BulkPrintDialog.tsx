import React from "react";
import { UnifiedInventoryLabels } from "../labels/UnifiedInventoryLabels";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductUnit {
  id: string;
  serial_number: string;
  barcode?: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  storage?: number;
  ram?: number;
  color?: string;
  battery_level?: number;
  status?: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  barcode?: string;
  category?: { name: string };
  year?: number;
  storage?: number;
  ram?: number;
  has_serial?: boolean;
  // Primary data source for serialized products
  units?: ProductUnit[];
  // Legacy compatibility
  serial_numbers?: string[];
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <UnifiedInventoryLabels
          products={products}
          companyName="GOLDEN PHONE SRL"
          buttonText="Generate and Print Labels"
        />
      </DialogContent>
    </Dialog>
  );
}