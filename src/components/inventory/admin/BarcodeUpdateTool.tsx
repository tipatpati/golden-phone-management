import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarcodeUpdateManager } from "../BarcodeUpdateManager";
import { Services } from '@/services/core';
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { RoleGuard } from "@/components/common/RoleGuard";
import type { Product } from "@/services/inventory/types";
import { UserRole } from "@/types/roles";

export function BarcodeUpdateTool() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { data: products } = useProducts();

  const productsArray = Array.isArray(products) ? products as Product[] : [];
  const selectedProduct = productsArray.find(p => p.id === selectedProductId);

  return (
    <RoleGuard requiredRoles={['super_admin' as UserRole, 'admin' as UserRole, 'inventory_manager' as UserRole]}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Barcode Update Tool</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update barcodes for products and their units
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-select">Select Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product to update barcodes" />
              </SelectTrigger>
              <SelectContent>
                {productsArray.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.brand} {product.model} {product.has_serial ? '(with units)' : '(bulk)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <BarcodeUpdateManager
              productId={selectedProduct.id}
              productName={`${selectedProduct.brand} ${selectedProduct.model}`}
              hasSerial={selectedProduct.has_serial || false}
              currentBarcode={selectedProduct.barcode || ''}
              onBarcodeUpdate={(newBarcode) => {
                console.log('Barcode updated:', newBarcode);
              }}
            />
          )}
        </CardContent>
      </Card>
    </RoleGuard>
  );
}