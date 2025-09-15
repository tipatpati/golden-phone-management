import React from "react";
import { Badge } from "@/components/ui/badge";
import { Euro } from "lucide-react";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import { cn } from "@/lib/utils";

interface ProductPricingBadgeProps {
  product: {
    price: number;
    has_serial: boolean;
    min_price?: number;
    max_price?: number;
  };
  className?: string;
}

/**
 * Displays pricing information for a product with appropriate styling
 * and indicators for unit-level pricing
 */
export function ProductPricingBadge({ product, className }: ProductPricingBadgeProps) {
  const pricingInfo = getProductPricingInfoSync(product);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span 
        className={cn(
          "font-medium",
          pricingInfo.type === 'unit-pricing' ? "text-blue-600" : "text-primary",
          pricingInfo.type === 'no-price' ? "text-muted-foreground" : ""
        )}
      >
        {pricingInfo.display}
      </span>
      
      {pricingInfo.type === 'unit-pricing' && (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Euro className="h-3 w-3" />
          Unità
        </Badge>
      )}
    </div>
  );
}