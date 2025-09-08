
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
  discountAmount?: number;
  finalSubtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
};

export function SaleTotals({ 
  saleItems, 
  discountAmount = 0,
  finalSubtotal,
  taxAmount,
  totalAmount
}: SaleTotalsProps) {
  if (saleItems.length === 0) {
    return null;
  }

  // Prices include 22% VAT, so we need to extract the base price
  const totalWithVAT = saleItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const originalSubtotal = totalWithVAT / 1.22; // Remove VAT to get base price
  const computedFinalSubtotal = finalSubtotal ?? (originalSubtotal - discountAmount);
  const computedTaxAmount = taxAmount ?? (computedFinalSubtotal * 0.22);
  const computedTotalAmount = totalAmount ?? (computedFinalSubtotal + computedTaxAmount);

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between">
        <span>Subtotale:</span>
        <span>€{originalSubtotal.toFixed(2)}</span>
      </div>
      
      {discountAmount > 0 && (
        <div className="flex justify-between text-orange-600">
          <span>Sconto:</span>
          <span>-€{discountAmount.toFixed(2)}</span>
        </div>
      )}
      
      {discountAmount > 0 && (
        <div className="flex justify-between">
          <span>Subtotale Scontato:</span>
          <span>€{computedFinalSubtotal.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between">
        <span>IVA (22%):</span>
        <span>€{computedTaxAmount.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>TOTALE:</span>
        <span>€{computedTotalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
