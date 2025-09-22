
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
  
  // Use provided values or calculate defaults
  const computedFinalSubtotal = finalSubtotal ?? originalSubtotal;
  const computedTaxAmount = taxAmount ?? (originalSubtotal * 0.22);
  const totalBeforeDiscount = computedFinalSubtotal + computedTaxAmount;
  const computedTotalAmount = totalAmount ?? (totalBeforeDiscount - discountAmount);

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between">
        <span>Subtotale:</span>
        <span>€{originalSubtotal.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between">
        <span>IVA (22%):</span>
        <span>€{computedTaxAmount.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between">
        <span>Totale:</span>
        <span>€{totalBeforeDiscount.toFixed(2)}</span>
      </div>
      
      {discountAmount > 0 && (
        <div className="flex justify-between text-orange-600">
          <span>Sconto:</span>
          <span>-€{discountAmount.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>TOTALE FINALE:</span>
        <span>€{computedTotalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
