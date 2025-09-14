import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { ProductUnit } from "@/services/inventory/types";
import { useAuth } from '@/contexts/AuthContext';
import { PurchasePriceGuard } from '@/components/common/PurchasePriceGuard';

interface ProductUnitsListProps {
  units: ProductUnit[];
  onEdit?: (unit: ProductUnit) => void;
  onDelete?: (unit: ProductUnit) => void;
  onView?: (unit: ProductUnit) => void;
}

export function ProductUnitsList({ units, onEdit, onDelete, onView }: ProductUnitsListProps) {
  const { userRole } = useAuth();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'sold': return 'secondary';
      case 'damaged': return 'destructive';
      case 'reserved': return 'outline';
      default: return 'default';
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'N/A';
    return `€${price.toFixed(2)}`;
  };

  if (units.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No units found for this product.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <Card key={unit.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Serial: {unit.serial_number}
              </CardTitle>
              <Badge variant={getStatusBadgeVariant(unit.status)}>
                {unit.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unit.barcode && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Barcode</span>
                  <p className="text-sm">{unit.barcode}</p>
                </div>
              )}
              
              {unit.color && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Color</span>
                  <p className="text-sm">{unit.color}</p>
                </div>
              )}
              
              {unit.storage && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Storage</span>
                  <p className="text-sm">{unit.storage}GB</p>
                </div>
              )}
              
              {unit.ram && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">RAM</span>
                  <p className="text-sm">{unit.ram}GB</p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <PurchasePriceGuard fallback={null}>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Purchase Price</span>
                  <p className="text-sm font-semibold">{formatPrice(unit.purchase_price)}</p>
                </div>
              </PurchasePriceGuard>
              
              {unit.price && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Base Price</span>
                  <p className="text-sm">{formatPrice(unit.price)}</p>
                </div>
              )}
              
              {unit.min_price && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Min Price</span>
                  <p className="text-sm">{formatPrice(unit.min_price)}</p>
                </div>
              )}
              
              {unit.max_price && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Max Price</span>
                  <p className="text-sm">{formatPrice(unit.max_price)}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {onView && (
                <Button variant="outline" size="sm" onClick={() => onView(unit)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(unit)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && userRole === 'super_admin' && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(unit)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}