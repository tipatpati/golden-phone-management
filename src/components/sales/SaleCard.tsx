import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { EditSaleDialog } from "./EditSaleDialog";
import { DeleteSaleDialog } from "./DeleteSaleDialog";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { SaleDetailsDialog } from "./SaleDetailsDialog";
import type { Sale } from "@/services/sales";
import { SalesDataService } from "@/services/sales/SalesDataService";

interface SaleCardProps {
  sale: Sale;
}

export function SaleCard({ sale }: SaleCardProps) {
  // Use formatted data from SalesDataService or format on demand
  const clientName = (sale as any).clientName || SalesDataService.getClientName(sale);
  const statusColor = (sale as any).statusColor || SalesDataService.getStatusColor(sale.status);
  const statusDisplay = (sale as any).statusDisplay || SalesDataService.getStatusDisplay(sale.status);
  const paymentMethodDisplay = (sale as any).paymentMethodDisplay || SalesDataService.getPaymentMethodDisplay(sale.payment_method);

  return (
    <Card className="card-glow hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:bg-gray-50/50 transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Sale Info */}
          <div className="xl:col-span-3 space-y-1">
            <div className="font-bold text-lg text-gray-900">{sale.sale_number}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(sale.sale_date), "dd/MM/yyyy")} • {format(new Date(sale.sale_date), "HH:mm")}
            </div>
          </div>

          {/* Client Info */}
          <div className="xl:col-span-2 space-y-1">
            <div className="font-semibold text-gray-900">{clientName}</div>
            <div className="text-sm text-muted-foreground truncate">
              {sale.client?.email || "No email provided"}
            </div>
          </div>

          {/* Salesperson */}
          <div className="xl:col-span-2 space-y-1">
            <div className="font-semibold text-gray-900">{sale.salesperson?.username || "Unknown"}</div>
            <div className="text-sm text-muted-foreground">Rappresentante Garentille</div>
          </div>

          {/* Items Summary */}
          <div className="xl:col-span-2 space-y-1">
            <div className="text-sm space-y-1">
              {sale.sale_items?.slice(0, 2).map((item, index) => (
                <div key={index} className="text-gray-700 font-medium">
                  {item.quantity}× {item.product ? `${item.product.brand} ${item.product.model}` : "Product"}
                </div>
              )) || <div className="text-muted-foreground">No items</div>}
              {sale.sale_items && sale.sale_items.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{sale.sale_items.length - 2} more items
                </div>
              )}
            </div>
          </div>

          {/* Payment & Total */}
          <div className="xl:col-span-2 space-y-1">
            <div className="font-bold text-xl text-gray-900">€{sale.total_amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {paymentMethodDisplay}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="xl:col-span-1 flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3">
            <Badge variant={statusColor} className="text-xs font-semibold px-3 py-1">
              {statusDisplay}
            </Badge>
            <div className="flex gap-2">
              <SaleDetailsDialog 
                sale={sale} 
                trigger={
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    <Eye className="h-3 w-3 mr-1.5" />
                    Visualizza
                  </Button>
                }
              />
              <SaleReceiptDialog sale={sale} />
              <EditSaleDialog sale={sale} />
              <DeleteSaleDialog sale={sale} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}