import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Euro, 
  Calendar, 
  Barcode, 
  Search,
  TrendingUp,
  TrendingDown,
  ShoppingCart
} from "lucide-react";
import { SuppliersApiService } from "@/services/suppliers/SuppliersApiService";
import { LoadingState } from "@/components/common";
import type { Supplier } from "@/services/suppliers/types";

interface SupplierProduct {
  id: string;
  serial_number: string;
  barcode?: string;
  purchase_price?: number;
  purchase_date?: string;
  status: string;
  condition: string;
  product: {
    brand: string;
    model: string;
    year?: number;
  };
  transaction?: {
    transaction_number: string;
    transaction_date: string;
  };
}

interface SupplierProductsDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const suppliersApi = new SuppliersApiService();

const formatCurrency = (amount?: number) => 
  amount !== undefined ? `€${amount.toFixed(2)}` : 'N/A';

const formatDate = (dateString?: string) => 
  dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-success';
    case 'sold': return 'bg-destructive';
    case 'damaged': return 'bg-warning';
    case 'repair': return 'bg-warning';
    case 'reserved': return 'bg-info';
    default: return 'bg-muted';
  }
};

export function SupplierProductsDialog({
  supplier,
  open,
  onOpenChange
}: SupplierProductsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['supplier-products', supplier?.id],
    queryFn: () => supplier ? suppliersApi.getSupplierProducts(supplier.id) : null,
    enabled: !!supplier?.id && open,
  });

  const filteredProducts = products?.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.serial_number.toLowerCase().includes(searchLower) ||
      product.product.brand.toLowerCase().includes(searchLower) ||
      product.product.model.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate statistics
  const stats = products ? {
    totalUnits: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    availableUnits: products.filter(p => p.status === 'available').length,
    soldUnits: products.filter(p => p.status === 'sold').length,
    averagePrice: products.length > 0 ? 
      products.reduce((sum, p) => sum + (p.purchase_price || 0), 0) / products.length : 0
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products from {supplier?.name}
          </DialogTitle>
          <DialogDescription>
            View all products acquired from this supplier
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading products: {error.message}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Total Units
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUnits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">{stats.availableUnits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-info" />
                      Sold
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-info">{stats.soldUnits}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Separator className="my-4" />

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by serial, brand, model, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No products match your search' : 'No products found for this supplier'}
                </div>
              ) : (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {product.product.brand} {product.product.model}
                              </div>
                              {product.product.year && (
                                <div className="text-sm text-muted-foreground">
                                  {product.product.year}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {product.serial_number}
                          </TableCell>
                          <TableCell className="font-mono">
                            {product.barcode || '-'}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.purchase_price)}
                          </TableCell>
                          <TableCell>
                            {formatDate(product.purchase_date)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.transaction ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {product.transaction.transaction_number}
                                </div>
                                <div className="text-muted-foreground">
                                  {formatDate(product.transaction.transaction_date)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">
                            {product.product.brand} {product.product.model}
                          </div>
                          {product.product.year && (
                            <div className="text-sm text-muted-foreground">
                              {product.product.year}
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4" />
                          <span className="font-mono">{product.serial_number}</span>
                        </div>
                        
                        {product.barcode && (
                          <div className="flex items-center gap-2">
                            <Barcode className="h-4 w-4" />
                            <span className="font-mono">{product.barcode}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          <span>{formatCurrency(product.purchase_price)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(product.purchase_date)}</span>
                        </div>
                        
                        {product.transaction && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground">Transaction:</div>
                            <div className="font-medium">{product.transaction.transaction_number}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(product.transaction.transaction_date)}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}