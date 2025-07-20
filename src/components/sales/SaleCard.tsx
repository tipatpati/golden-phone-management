import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { EditSaleDialog } from "./EditSaleDialog";
import { DeleteSaleDialog } from "./DeleteSaleDialog";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import type { Sale } from "@/services/sales";

interface SaleCardProps {
  sale: Sale;
}

export function SaleCard({ sale }: SaleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "refunded": return "destructive";
      case "pending": return "secondary";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getClientName = (client: any) => {
    if (!client) return "Walk-in Customer";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  return (
    <Card className="card-glow hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:bg-gray-50/50 transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Sale Info */}
          <div className="xl:col-span-3 space-y-1">
            <div className="font-bold text-lg text-gray-900">{sale.sale_number}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(sale.sale_date), "MMM dd, yyyy")} • {format(new Date(sale.sale_date), "HH:mm")}
            </div>
          </div>

          {/* Client Info */}
          <div className="xl:col-span-2 space-y-1">
            <div className="font-semibold text-gray-900">{getClientName(sale.client)}</div>
            <div className="text-sm text-muted-foreground truncate">
              {sale.client?.email || "No email provided"}
            </div>
          </div>

          {/* Salesperson */}
          <div className="xl:col-span-2 space-y-1">
            <div className="font-semibold text-gray-900">{sale.salesperson?.username || "Unknown"}</div>
            <div className="text-sm text-muted-foreground">Sales Representative</div>
          </div>

          {/* Items Summary */}
          <div className="xl:col-span-2 space-y-1">
            <div className="text-sm space-y-1">
              {sale.sale_items?.slice(0, 2).map((item, index) => (
                <div key={index} className="text-gray-700 font-medium">
                  {item.quantity}× {item.product?.name || "Product"}
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
            <div className="font-bold text-xl text-gray-900">${sale.total_amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground capitalize font-medium">
              {sale.payment_method.replace('_', ' ')}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="xl:col-span-1 flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3">
            <Badge variant={getStatusColor(sale.status)} className="text-xs font-semibold px-3 py-1">
              {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
            </Badge>
            <div className="flex gap-1">
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