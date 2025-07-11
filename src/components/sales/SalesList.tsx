import React from "react";
import { SaleCard } from "./SaleCard";
import type { Sale } from "@/services/sales";

interface SalesListProps {
  sales: Sale[];
}

export function SalesList({ sales }: SalesListProps) {
  return (
    <div className="space-y-4">
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}