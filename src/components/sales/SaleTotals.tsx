
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
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Tax (10%):</span>
        <span>${tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
