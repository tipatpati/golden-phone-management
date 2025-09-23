import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Hash, 
  Palette, 
  HardDrive, 
  Zap, 
  Battery, 
  Calendar,
  Package,
  ShoppingCart,
  User,
  Euro,
  Building,
  FileText,
  Phone,
  Mail,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  Box,
  Tag,
  CreditCard,
  Percent
} from 'lucide-react';
import { ProductTraceResult } from '@/services/tracing/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface TraceResultCardProps {
  traceResult: ProductTraceResult;
  className?: string;
}

export function TraceResultCard({ traceResult, className }: TraceResultCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return new Date(dateString).toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'sold':
        return 'bg-blue-500';
      case 'damaged':
        return 'bg-red-500';
      case 'repair':
        return 'bg-yellow-500';
      case 'reserved':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {traceResult.productInfo.brand} {traceResult.productInfo.model}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Serial: {traceResult.unitDetails.serial_number}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-white border-transparent", getStatusColor(traceResult.currentStatus))}
          >
            {traceResult.currentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Information */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Product Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>Category: {traceResult.productInfo.category || 'N/A'}</span>
            </div>
            {traceResult.productInfo.barcode && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>Barcode: {traceResult.productInfo.barcode}</span>
              </div>
            )}
            {traceResult.unitDetails.barcode && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>Unit Barcode: {traceResult.unitDetails.barcode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unit Details */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Unit Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {traceResult.unitDetails.color && (
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span>Color: {traceResult.unitDetails.color}</span>
              </div>
            )}
            {traceResult.unitDetails.storage && (
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>Storage: {traceResult.unitDetails.storage}GB</span>
              </div>
            )}
            {traceResult.unitDetails.ram && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>RAM: {traceResult.unitDetails.ram}GB</span>
              </div>
            )}
            {traceResult.unitDetails.battery_level && (
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-muted-foreground" />
                <span>Battery: {traceResult.unitDetails.battery_level}%</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>Condition: {traceResult.unitDetails.condition}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added: {formatDate(traceResult.unitDetails.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Acquisition History */}
        {traceResult.acquisitionHistory && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Supplier Acquisition Details
              </h3>
              
              {/* Supplier Information */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Supplier Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {traceResult.acquisitionHistory.supplier_name && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{traceResult.acquisitionHistory.supplier_name}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.supplier_contact && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Contact: {traceResult.acquisitionHistory.supplier_contact}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.supplier_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{traceResult.acquisitionHistory.supplier_email}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.supplier_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{traceResult.acquisitionHistory.supplier_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Information */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Transaction Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {traceResult.acquisitionHistory.transaction_number && (
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span>TX: {traceResult.acquisitionHistory.transaction_number}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.transaction_id && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>ID: {traceResult.acquisitionHistory.transaction_id}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.transaction_type && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Type: {traceResult.acquisitionHistory.transaction_type}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.transaction_status && (
                    <div className="flex items-center gap-2">
                      {traceResult.acquisitionHistory.transaction_status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : traceResult.acquisitionHistory.transaction_status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Status: {traceResult.acquisitionHistory.transaction_status}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.transaction_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Date: {formatDate(traceResult.acquisitionHistory.transaction_date)}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.quantity && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Quantity: {traceResult.acquisitionHistory.quantity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="mb-4 p-3 bg-accent/30 rounded-lg">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Financial Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {traceResult.acquisitionHistory.unit_cost && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>Unit Cost: €{Number(traceResult.acquisitionHistory.unit_cost).toFixed(2)}</span>
                    </div>
                  )}
                  {traceResult.acquisitionHistory.total_cost && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>Total Cost: €{Number(traceResult.acquisitionHistory.total_cost).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Products */}
              {traceResult.acquisitionHistory.transaction_items && traceResult.acquisitionHistory.transaction_items.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-xs mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    All Products in Transaction ({traceResult.acquisitionHistory.transaction_items.length})
                  </h4>
                  <div className="space-y-3">
                    {traceResult.acquisitionHistory.transaction_items.map((item, index) => (
                      <div key={item.id} className="bg-white dark:bg-gray-900 p-3 rounded border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">
                              {item.product_details.brand} {item.product_details.model}
                            </span>
                            {item.product_details.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.product_details.category}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {item.product_details.has_serial ? 'Serial Tracked' : 'Stock Only'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span>Unit: €{Number(item.unit_cost).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span>Total: €{Number(item.total_cost).toFixed(2)}</span>
                          </div>
                          {item.product_details.barcode && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{item.product_details.barcode}</span>
                            </div>
                          )}
                        </div>

                        {item.product_details.description && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {item.product_details.description}
                          </p>
                        )}

                        {/* Individual units if available */}
                        {item.unit_details && item.unit_details.length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            <div className="font-medium mb-1">Individual Units:</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {item.unit_details.map((unit, unitIndex) => (
                                <div key={unitIndex} className="flex items-center gap-2">
                                  {unit.serial_number && (
                                    <span>S/N: {unit.serial_number}</span>
                                  )}
                                  {unit.color && (
                                    <span className="text-muted-foreground">({unit.color})</span>
                                  )}
                                  {unit.storage && (
                                    <span className="text-muted-foreground">{unit.storage}GB</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {traceResult.acquisitionHistory.notes && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Notes</h4>
                  <p className="text-sm">{traceResult.acquisitionHistory.notes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sale Information */}
        {traceResult.saleInfo && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Sale Information
              </h3>
              
              {/* Sale Summary */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Sale Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span>Sale: {traceResult.saleInfo.sale_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Date: {formatDate(traceResult.saleInfo.sold_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>Unit Price: €{Number(traceResult.saleInfo.sold_price).toFixed(2)}</span>
                  </div>
                  {traceResult.saleInfo.total_amount && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Total: €{Number(traceResult.saleInfo.total_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              {(traceResult.saleInfo.customer_name || traceResult.saleInfo.customer_email || traceResult.saleInfo.customer_phone) && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {traceResult.saleInfo.customer_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{traceResult.saleInfo.customer_name}</span>
                        {traceResult.saleInfo.customer_type && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {traceResult.saleInfo.customer_type}
                          </Badge>
                        )}
                      </div>
                    )}
                    {traceResult.saleInfo.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{traceResult.saleInfo.customer_email}</span>
                      </div>
                    )}
                    {traceResult.saleInfo.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{traceResult.saleInfo.customer_phone}</span>
                      </div>
                    )}
                    {traceResult.saleInfo.salesperson_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Sold by: {traceResult.saleInfo.salesperson_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Payment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {traceResult.saleInfo.payment_method && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Method: {traceResult.saleInfo.payment_method}</span>
                    </div>
                  )}
                  {traceResult.saleInfo.payment_type && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span>Type: {traceResult.saleInfo.payment_type}</span>
                    </div>
                  )}
                  {traceResult.saleInfo.subtotal && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>Subtotal: €{Number(traceResult.saleInfo.subtotal).toFixed(2)}</span>
                    </div>
                  )}
                  {traceResult.saleInfo.tax_amount && traceResult.saleInfo.tax_amount > 0 && (
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span>Tax: €{Number(traceResult.saleInfo.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {traceResult.saleInfo.discount_amount && traceResult.saleInfo.discount_amount > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-500" />
                      <span>Discount: -€{Number(traceResult.saleInfo.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Products */}
              {traceResult.saleInfo.sale_items && traceResult.saleInfo.sale_items.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-xs mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    All Products in Sale ({traceResult.saleInfo.sale_items.length})
                  </h4>
                  <div className="space-y-3">
                    {traceResult.saleInfo.sale_items.map((item, index) => (
                      <div key={item.id} className="bg-white dark:bg-gray-900 p-3 rounded border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-sm">
                              {item.product_details.brand} {item.product_details.model}
                            </span>
                            {item.product_details.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.product_details.category}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {item.product_details.has_serial ? 'Serial Tracked' : 'Stock Only'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span>Unit: €{Number(item.unit_price).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span>Total: €{Number(item.total_price).toFixed(2)}</span>
                          </div>
                          {item.serial_number && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">S/N: {item.serial_number}</span>
                            </div>
                          )}
                        </div>

                        {item.product_details.description && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {item.product_details.description}
                          </p>
                        )}

                        {item.product_details.barcode && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">Barcode: </span>
                            <span className="font-mono">{item.product_details.barcode}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sale Notes */}
              {traceResult.saleInfo.notes && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Sale Notes</h4>
                  <p className="text-sm">{traceResult.saleInfo.notes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Profit Calculation (if both acquisition and sale data exist) */}
        {traceResult.acquisitionHistory?.unit_cost && traceResult.saleInfo && (
          <div className="bg-accent/50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Profit:</span>
              <span className="font-semibold text-green-600">
                €{(Number(traceResult.saleInfo.sold_price) - Number(traceResult.acquisitionHistory.unit_cost)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}