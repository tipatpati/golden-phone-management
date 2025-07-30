
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { type Sale } from "@/services/useSales";
import { format } from "date-fns";

interface SaleReceiptDialogProps {
  sale: Sale;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SaleReceiptDialog({ sale, open, onOpenChange }: SaleReceiptDialogProps) {
  const getClientName = (client: any) => {
    if (!client) return "Walk-in Customer";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const handlePrint = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${sale.sale_number}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 5mm;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 8px;
              width: 70mm;
              color: #000;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .receipt-number {
              font-size: 11px;
              color: #666;
            }
            .receipt-section {
              margin-bottom: 8px;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .receipt-items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 8px 0;
              margin: 8px 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 11px;
            }
            .receipt-totals {
              margin-top: 8px;
            }
            .receipt-total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 4px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 12px;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body { width: auto; }
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Only show trigger if not controlled externally */}
      {!open && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Receipt className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sale Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <div className="text-center border-b pb-4">
            <h3 className="font-bold text-lg">Sales Receipt</h3>
            <p className="text-muted-foreground">Sale #{sale.sale_number}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{format(new Date(sale.sale_date), "MMM dd, yyyy HH:mm")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Customer:</span>
              <span>{getClientName(sale.client)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Salesperson:</span>
              <span>{sale.salesperson?.username || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment:</span>
              <span className="capitalize">{sale.payment_method.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Items:</h4>
            <div className="space-y-1">
              {sale.sale_items?.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{item.quantity}× {item.product ? `${item.product.brand} ${item.product.model}` : "Product"}</span>
                  <span>${item.total_price.toFixed(2)}</span>
                </div>
              )) || <p className="text-muted-foreground text-xs">No items</p>}
            </div>
          </div>

          <div className="border-t pt-4 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${sale.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${sale.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="border-t pt-4">
              <span className="font-medium">Notes:</span>
              <p className="text-muted-foreground mt-1">{sale.notes}</p>
            </div>
          )}

          {/* Hidden receipt content for printing */}
          <div id="receipt-content" style={{display: 'none'}}>
            <div className="receipt-header">
              <div className="receipt-title">SALES RECEIPT</div>
              <div className="receipt-number">#{sale.sale_number}</div>
            </div>

            <div className="receipt-section">
              <div className="receipt-row">
                <span>Date:</span>
                <span>{format(new Date(sale.sale_date), "MMM dd, yyyy HH:mm")}</span>
              </div>
              <div className="receipt-row">
                <span>Customer:</span>
                <span>{getClientName(sale.client)}</span>
              </div>
              <div className="receipt-row">
                <span>Cashier:</span>
                <span>{sale.salesperson?.username || "Unknown"}</span>
              </div>
              <div className="receipt-row">
                <span>Payment:</span>
                <span style={{textTransform: 'capitalize'}}>{sale.payment_method.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="receipt-items">
              {sale.sale_items?.map((item, index) => (
                <div key={index} className="receipt-item">
                  <span>{item.quantity}× {item.product ? `${item.product.brand} ${item.product.model}` : "Product"}</span>
                  <span>${item.total_price.toFixed(2)}</span>
                </div>
              )) || <div className="receipt-item">No items</div>}
            </div>

            <div className="receipt-totals">
              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Tax:</span>
                <span>${sale.tax_amount.toFixed(2)}</span>
              </div>
              <div className="receipt-row receipt-total">
                <span>TOTAL:</span>
                <span>${sale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {sale.notes && (
              <div className="receipt-section">
                <div style={{marginBottom: '4px'}}>Notes:</div>
                <div style={{fontSize: '10px', color: '#666'}}>{sale.notes}</div>
              </div>
            )}

            <div className="receipt-footer">
              Thank you for your business!<br/>
              {format(new Date(), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
