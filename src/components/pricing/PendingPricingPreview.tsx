import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { PendingPricingChange } from '@/hooks/usePendingPricingChanges';

interface PendingPricingPreviewProps {
  pendingChanges: PendingPricingChange[];
  onApplyChanges: () => void;
  onCancelChanges: () => void;
  className?: string;
}

export function PendingPricingPreview({
  pendingChanges,
  onApplyChanges,
  onCancelChanges,
  className = ''
}: PendingPricingPreviewProps) {
  if (pendingChanges.length === 0) return null;

  const formatPrice = (price: number | undefined) => 
    price !== undefined ? `€${price.toFixed(2)}` : 'Not set';

  return (
    <Card className={`border-warning/50 bg-warning/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Pending Pricing Changes
          <Badge variant="secondary" className="ml-auto">
            {pendingChanges.length} unit{pendingChanges.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary of changes */}
        <div className="space-y-2">
          {pendingChanges.map((change, index) => (
            <div key={`${change.unitIndex}-${index}`} className="p-3 rounded-md bg-background/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Unit #{change.unitIndex + 1}</span>
                {change.templateName && (
                  <Badge variant="outline" className="text-xs">
                    {change.templateName}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                {/* Purchase Price */}
                {change.originalUnit.price !== change.proposedUnit.price && (
                  <div className="flex justify-between">
                    <span>Purchase Price:</span>
                    <span>
                      <span className="line-through">{formatPrice(change.originalUnit.price)}</span>
                      {' → '}
                      <span className="text-primary font-medium">{formatPrice(change.proposedUnit.price)}</span>
                    </span>
                  </div>
                )}
                
                {/* Min Price */}
                {change.originalUnit.min_price !== change.proposedUnit.min_price && (
                  <div className="flex justify-between">
                    <span>Min Price:</span>
                    <span>
                      <span className="line-through">{formatPrice(change.originalUnit.min_price)}</span>
                      {' → '}
                      <span className="text-primary font-medium">{formatPrice(change.proposedUnit.min_price)}</span>
                    </span>
                  </div>
                )}
                
                {/* Max Price */}
                {change.originalUnit.max_price !== change.proposedUnit.max_price && (
                  <div className="flex justify-between">
                    <span>Max Price:</span>
                    <span>
                      <span className="line-through">{formatPrice(change.originalUnit.max_price)}</span>
                      {' → '}
                      <span className="text-primary font-medium">{formatPrice(change.proposedUnit.max_price)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={onApplyChanges}
            className="flex-1"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Apply Changes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelChanges}
            className="flex-1"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}