import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { type Sale } from "@/services";
import { format } from "date-fns";

interface SaleReceiptDialogProps {
  sale: Sale;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ITALIAN RECEIPT FORMAT COMPONENT

export function SaleReceiptDialog({ sale, open, onOpenChange }: SaleReceiptDialogProps) {
  // Force re-render by adding a unique key
  const componentKey = `receipt-${sale.id}-${Date.now()}`;
  
  const getClientName = (client: any) => {
    if (!client) return "Cliente Occasionale";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const generateQRCode = (saleData: Sale) => {
    const qrContent = `PHONE PLANET|Ricevuta: ${saleData.sale_number}|Data: ${format(new Date(saleData.sale_date), "dd/MM/yyyy")}|Totale: €${saleData.total_amount.toFixed(2)}`;
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="white"/>
        <rect x="10" y="10" width="60" height="60" fill="none" stroke="black" stroke-width="2"/>
        <text x="40" y="45" text-anchor="middle" font-size="8" fill="black">QR CODE</text>
      </svg>
    `)}`;
  };

  const handlePrint = () => {
    const receiptId = `receipt-content-${sale.id}`;
    const receiptContent = document.getElementById(receiptId);
    if (!receiptContent) {
      console.error('Receipt content not found with ID:', receiptId);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Could not open print window');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Ricevuta #${sale.sale_number}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.1;
              margin: 0;
              padding: 3mm;
              width: 74mm;
              color: #000;
              background: white;
            }
            .company-header {
              text-align: center;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 1px solid #000;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 1px;
              letter-spacing: 1px;
            }
            .company-details {
              font-size: 9px;
              line-height: 1.2;
              margin-bottom: 0;
            }
            .receipt-info {
              margin: 6px 0;
              padding: 3px 0;
              border-bottom: 1px dashed #000;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              font-size: 10px;
              font-weight: normal;
            }
            .items-header {
              margin: 6px 0 3px 0;
              font-weight: bold;
              font-size: 10px;
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
            }
            .items-section {
              margin: 6px 0;
              padding: 2px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
              align-items: flex-start;
            }
            .item-desc {
              flex: 1;
              margin-right: 6px;
              word-wrap: break-word;
              max-width: 45mm;
            }
            .item-qty {
              width: 12mm;
              text-align: center;
              font-weight: bold;
            }
            .item-price {
              width: 18mm;
              text-align: right;
              font-weight: bold;
            }
            .totals-section {
              margin-top: 6px;
              padding-top: 3px;
              border-top: 1px dashed #000;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              font-size: 10px;
            }
            .final-total {
              font-weight: bold;
              font-size: 12px;
              border-top: 2px solid #000;
              padding-top: 2px;
              margin-top: 2px;
            }
            .payment-section {
              margin: 6px 0;
              padding: 3px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            .qr-section {
              text-align: center;
              margin: 8px 0 6px 0;
            }
            .qr-code {
              width: 50px;
              height: 50px;
              margin: 2px auto;
            }
            .footer {
              text-align: center;
              margin-top: 6px;
              font-size: 9px;
              line-height: 1.3;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 2px;
              font-size: 10px;
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
          <DialogTitle>Ricevuta di Vendita</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          {/* Preview of receipt */}
          <div className="text-center border-b pb-4">
            <h3 className="font-bold text-lg">PHONE PLANET</h3>
            <p className="text-xs text-muted-foreground">di AMIRALI MOHAMADALI</p>
            <p className="text-xs">Ricevuta #{sale.sale_number}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Data:</span>
              <span>{format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cliente:</span>
              <span>{getClientName(sale.client)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Operatore:</span>
              <span>{sale.salesperson?.username || "Sconosciuto"}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-center">ARTICOLI</h4>
            <div className="space-y-1">
              {sale.sale_items?.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="flex-1">{item.product ? `${item.product.brand} ${item.product.model}` : "Prodotto"}</span>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <span className="w-16 text-right">€{item.total_price.toFixed(2)}</span>
                </div>
              )) || <p className="text-muted-foreground text-xs">Nessun articolo</p>}
            </div>
          </div>

          <div className="border-t pt-4 space-y-1">
            <div className="flex justify-between">
              <span>Subtotale:</span>
              <span>€{sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span>€{sale.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>TOTALE:</span>
              <span>€{sale.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Hidden receipt content for printing */}
          <div id={`receipt-content-${sale.id}`} style={{display: 'none'}}>
            <div className="company-header">
              <div className="company-name">PHONE PLANET</div>
              <div className="company-details">
                di AMIRALI MOHAMADALI<br/>
                Via Example 123, 00100 Roma RM<br/>
                Tel: +39 06 123456789<br/>
                P.IVA: 12345678901
              </div>
            </div>

            <div className="receipt-info">
              <div className="receipt-row">
                <span>Data:</span>
                <span>{format(new Date(sale.sale_date), "dd/MM/yyyy")}</span>
              </div>
              <div className="receipt-row">
                <span>Ora:</span>
                <span>{format(new Date(sale.sale_date), "HH:mm")}</span>
              </div>
              <div className="receipt-row">
                <span>Ricevuta N°:</span>
                <span>{sale.sale_number}</span>
              </div>
              <div className="receipt-row">
                <span>Cliente:</span>
                <span>{getClientName(sale.client)}</span>
              </div>
              <div className="receipt-row">
                <span>Operatore:</span>
                <span>{sale.salesperson?.username || "Sconosciuto"}</span>
              </div>
            </div>

            <div className="items-header">
              DETTAGLIO ACQUISTO
            </div>

            <div className="items-section">
              <div className="item-row" style={{fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>
                <span className="item-desc">DESCRIZIONE</span>
                <span className="item-qty">QTÀ</span>
                <span className="item-price">PREZZO</span>
              </div>
              {sale.sale_items?.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-desc">
                    {item.product ? `${item.product.brand} ${item.product.model}${item.product.year ? ` (${item.product.year})` : ''}` : "Prodotto"}
                    {item.serial_number && <div style={{fontSize: '7px', color: '#666'}}>S/N: {item.serial_number}</div>}
                  </span>
                  <span className="item-qty">{item.quantity}</span>
                  <span className="item-price">€{item.total_price.toFixed(2)}</span>
                </div>
              )) || <div className="item-row">Nessun articolo</div>}
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotale:</span>
                <span>€{sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>IVA (22%):</span>
                <span>€{sale.tax_amount.toFixed(2)}</span>
              </div>
              <div className="total-row final-total">
                <span>TOTALE:</span>
                <span>€{sale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-section">
              <div className="total-row">
                <span>Metodo Pagamento:</span>
                <span style={{textTransform: 'capitalize'}}>
                  {sale.payment_method === 'cash' ? 'Contanti' : 
                   sale.payment_method === 'card' ? 'Carta' :
                   sale.payment_method === 'bank_transfer' ? 'Bonifico' : 
                   sale.payment_method.replace('_', ' ')}
                </span>
              </div>
              {sale.payment_method === 'cash' && (
                <>
                  <div className="total-row">
                    <span>Contanti Ricevuti:</span>
                    <span>€{sale.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Resto:</span>
                    <span>€0.00</span>
                  </div>
                </>
              )}
            </div>

            {sale.notes && (
              <div className="receipt-info">
                <div style={{fontWeight: 'bold', marginBottom: '2px'}}>Note:</div>
                <div style={{fontSize: '8px'}}>{sale.notes}</div>
              </div>
            )}

            <div className="qr-section">
              <img 
                src={generateQRCode(sale)} 
                alt="QR Code" 
                className="qr-code"
              />
              <div style={{fontSize: '7px', marginTop: '2px'}}>
                Scansiona per info ricevuta
              </div>
            </div>

            <div className="footer">
              <div className="thank-you">GRAZIE PER LA FIDUCIA!</div>
              <div>Arrivederci e a presto</div>
              <div style={{marginTop: '4px', fontSize: '7px'}}>
                Documento commerciale non fiscale<br/>
                Stampato il: {format(new Date(), "dd/MM/yyyy HH:mm")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            Stampa Ricevuta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}