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
  Clock
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
              <div className="p-3 bg-accent/30 rounded-lg">
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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Sale: {traceResult.saleInfo.sale_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span>Price: €{Number(traceResult.saleInfo.sold_price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Date: {formatDate(traceResult.saleInfo.sold_at)}</span>
                </div>
                {traceResult.saleInfo.customer_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Customer: {traceResult.saleInfo.customer_name}</span>
                  </div>
                )}
                {traceResult.saleInfo.salesperson_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Sold by: {traceResult.saleInfo.salesperson_name}</span>
                  </div>
                )}
                {traceResult.saleInfo.payment_method && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>Payment: {traceResult.saleInfo.payment_method}</span>
                  </div>
                )}
              </div>
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