
import React from "react";

type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  serial_number?: string;
};

type SaleTotalsProps = {
  saleItems: SaleItem[];
};

export function SaleTotals({ saleItems }: SaleTotalsProps) {
  if (saleItems.length === 0) {
    return null;
  }

  const subtotal = saleItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  // Use configurable tax rate - for now defaulting to 22% (Italian standard VAT)
  const tax = subtotal * 0.22;
  const total = subtotal + tax;

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between">
        <span>Subtotale:</span>
        <span>€{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>IVA (22%):</span>
        <span>€{tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-lg">
        <span>TOTALE:</span>
        <span>€{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
