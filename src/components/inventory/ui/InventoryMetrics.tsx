import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, DollarSign, Calendar, User } from "lucide-react";

interface InventoryMetricsProps {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  lastUpdated?: Date;
  updatedBy?: string;
  className?: string;
}

/**
 * Reusable metrics display component for inventory overview
 */
export function InventoryMetrics({
  totalItems,
  lowStockItems,
  outOfStockItems,
  totalValue,
  lastUpdated,
  updatedBy,
  className
}: InventoryMetricsProps) {
  const inStockItems = totalItems - outOfStockItems;
  const healthyStockItems = inStockItems - lowStockItems;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total Items */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Total Items</span>
        </div>
        <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">
          {inStockItems.toLocaleString()} in stock
        </div>
      </div>

      {/* Stock Status */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Healthy Stock</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          {healthyStockItems.toLocaleString()}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            {lowStockItems} Low
          </Badge>
          <Badge variant="outline" className="text-xs border-red-500 text-red-600">
            {outOfStockItems} Out
          </Badge>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Total Value</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          €{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-muted-foreground">
          Inventory worth
        </div>
      </div>

      {/* Last Updated */}
      <div className="bg-background border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Last Updated</span>
        </div>
        <div className="text-sm font-semibold">
          {lastUpdated ? lastUpdated.toLocaleDateString() : 'N/A'}
        </div>
        {updatedBy && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {updatedBy}
          </div>
        )}
      </div>
    </div>
  );
}