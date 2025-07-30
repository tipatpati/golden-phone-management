import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Receipt, User, CreditCard, CalendarDays, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { Sale } from '@/services/sales';

interface SaleDetailsDialogProps {
  sale: Sale;
  trigger?: React.ReactNode;
}

export function SaleDetailsDialog({ sale, trigger }: SaleDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "refunded": return "destructive";
      case "pending": return "secondary";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getClientInfo = () => {
    if (!sale.client) return { name: "Walk-in Customer", type: "individual" };
    
    if (sale.client.type === "business") {
      return {
        name: sale.client.company_name || "Business Client",
        type: "business",
        contact: sale.client.contact_person,
        email: sale.client.email,
        phone: sale.client.phone
      };
    } else {
      return {
        name: `${sale.client.first_name || ""} ${sale.client.last_name || ""}`.trim() || "Individual Client",
        type: "individual",
        email: sale.client.email,
        phone: sale.client.phone
      };
    }
  };

  const clientInfo = getClientInfo();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-9 px-3 font-medium">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sale Details - {sale.sale_number}
          </DialogTitle>
          <DialogDescription>
            Complete information for sale #{sale.sale_number}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sale Number</label>
                  <p className="font-mono font-semibold">{sale.sale_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="pt-1">
                    <Badge variant={getStatusColor(sale.status)} className="text-xs">
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Sale Date
                  </label>
                  <p className="font-medium">
                    {format(new Date(sale.sale_date), "PPP")} at {format(new Date(sale.sale_date), "HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Payment Method
                  </label>
                  <p className="font-medium capitalize">
                    {sale.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Salesperson
                </label>
                <p className="font-medium">{sale.salesperson?.username || "Unknown"}</p>
              </div>

              {sale.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{sale.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                <p className="font-semibold">{clientInfo.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Client Type</label>
                <div className="pt-1">
                  <Badge variant="outline" className="text-xs">
                    {clientInfo.type === "business" ? "Business" : "Individual"}
                  </Badge>
                </div>
              </div>

              {clientInfo.contact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                  <p className="font-medium">{clientInfo.contact}</p>
                </div>
              )}

              {clientInfo.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium text-sm">{clientInfo.email}</p>
                </div>
              )}

              {clientInfo.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-medium">{clientInfo.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sale Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Sale Items ({sale.sale_items?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sale.sale_items && sale.sale_items.length > 0 ? (
              <div className="space-y-3">
                {sale.sale_items.map((item, index) => (
                  <div key={item.id || index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {item.product ? `${item.product.brand} ${item.product.model}` : "Product"}
                        {item.product?.year && ` (${item.product.year})`}
                      </p>
                      {item.serial_number && (
                        <p className="text-sm text-muted-foreground font-mono">
                          S/N: {item.serial_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Qty:</span>
                        <span className="font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Unit:</span>
                        <span className="font-medium">${item.unit_price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Total:</span>
                        <span className="font-bold">${item.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items found for this sale
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sale Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Sale Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Amount</span>
                <span className="font-medium">${sale.tax_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-primary">${sale.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}