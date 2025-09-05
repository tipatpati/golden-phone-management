import React, { useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { type Sale } from "@/services";
import { format } from "date-fns";
import QRCode from "qrcode";

interface SaleReceiptDialogProps {
  sale: Sale;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SaleReceiptDialog({ sale, open, onOpenChange }: SaleReceiptDialogProps) {
  // Optimized client name calculation
  const clientName = useMemo(() => {
    if (!sale?.client) {
      return "Cliente Occasionale";
    }
    return sale.client.type === "business" 
      ? sale.client.company_name 
      : `${sale.client.first_name} ${sale.client.last_name}`;
  }, [sale?.client]);

  // QR code generation state
  const [qrCode, setQrCode] = React.useState<string>('');
  const [isQrCodeGenerating, setIsQrCodeGenerating] = React.useState<boolean>(true);

  // Generate QR code
  React.useEffect(() => {
    if (!sale) return;
    
    const generateQRCode = async () => {
      setIsQrCodeGenerating(true);
      
      try {
        const qrContent = `GOLDEN PHONE
Ricevuta: ${sale.sale_number}
Data: ${format(new Date(sale.sale_date), "dd/MM/yyyy")}
Totale: €${sale.total_amount.toFixed(2)}`;
        
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: 80,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error('QR code generation failed:', error);
        setQrCode('');
      } finally {
        setIsQrCodeGenerating(false);
      }
    };

    generateQRCode();
  }, [sale?.sale_number, sale?.sale_date, sale?.total_amount]);

  const handlePrint = async () => {
    // Wait for QR code if it's still generating
    if (isQrCodeGenerating) {
      console.log('Waiting for QR code generation to complete...');
      return;
    }

    const receiptId = `receipt-content-${sale.id}`;
    const receiptContent = document.getElementById(receiptId);
    
    if (!receiptContent) {
      console.error('Receipt content not found');
      return;
    }

    // Create optimized print content
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Could not open print window - popup blocked?');
      return;
    }
    
    try {
      const htmlContent = `
      <html>
        <head>
          <title>Ricevuta #${sale.sale_number}</title>
          <style>
            @page {
              size: 80mm 120mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              font-family: 'Courier New', monospace !important;
              font-size: 6px !important;
              line-height: 1.1 !important;
              margin: 0 !important;
              padding: 2mm !important;
              width: 80mm !important;
              max-width: 80mm !important;
              height: 120mm !important;
              max-height: 120mm !important;
              color: #000 !important;
              background: white !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            .receipt-container {
              width: 76mm !important;
              max-width: 76mm !important;
              height: 116mm !important;
              max-height: 116mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
            }
            .company-header {
              text-align: center !important;
              margin-bottom: 2mm !important;
              padding-bottom: 1mm !important;
              border-bottom: 1px solid #000 !important;
            }
            .company-name {
              font-size: 8px !important;
              font-weight: bold !important;
              margin-bottom: 0.5mm !important;
            }
            .company-details {
              font-size: 5px !important;
              line-height: 1.0 !important;
            }
            .receipt-info {
              margin: 1.5mm 0 !important;
              padding: 1mm 0 !important;
              border-bottom: 1px dashed #000 !important;
            }
            .receipt-row {
              display: flex !important;
              justify-content: space-between !important;
              margin-bottom: 0.5mm !important;
              font-size: 5px !important;
            }
            .items-header {
              margin: 1.5mm 0 1mm 0 !important;
              font-weight: bold !important;
              font-size: 6px !important;
              text-align: center !important;
              border-bottom: 1px solid #000 !important;
              padding-bottom: 0.5mm !important;
            }
            .items-section {
              margin: 1.5mm 0 !important;
              padding: 0 !important;
              max-height: 30mm !important;
              overflow: hidden !important;
            }
            .item-row {
              display: flex !important;
              justify-content: space-between !important;
              margin-bottom: 0.5mm !important;
              font-size: 5px !important;
              align-items: flex-start !important;
              page-break-inside: avoid !important;
            }
            .item-desc {
              flex: 1 !important;
              margin-right: 2mm !important;
              overflow: hidden !important;
              white-space: nowrap !important;
              text-overflow: ellipsis !important;
              max-width: 35mm !important;
            }
            .item-qty {
              width: 8mm !important;
              text-align: center !important;
              font-weight: bold !important;
            }
            .item-price {
              width: 15mm !important;
              text-align: right !important;
              font-weight: bold !important;
            }
            .totals-section {
              margin-top: 2mm !important;
              padding-top: 1mm !important;
              border-top: 1px dashed #000 !important;
            }
            .total-row {
              display: flex !important;
              justify-content: space-between !important;
              margin-bottom: 0.5mm !important;
              font-size: 5px !important;
            }
            .final-total {
              font-weight: bold !important;
              font-size: 7px !important;
              border-top: 2px solid #000 !important;
              padding-top: 1mm !important;
              margin-top: 1mm !important;
            }
            .payment-section {
              margin: 1.5mm 0 !important;
              padding: 1mm 0 !important;
              font-size: 5px !important;
              text-align: center !important;
              border-top: 1px dashed #000 !important;
              border-bottom: 1px dashed #000 !important;
            }
            .qr-section {
              text-align: center !important;
              margin: 2mm 0 1.5mm 0 !important;
            }
            .qr-code {
              width: 20px !important;
              height: 20px !important;
              margin: 0.5mm auto !important;
            }
            .footer {
              text-align: center !important;
              margin-top: 2mm !important;
              font-size: 4px !important;
              line-height: 1.0 !important;
            }
            .thank-you {
              font-weight: bold !important;
              margin-bottom: 0.5mm !important;
              font-size: 5px !important;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptContent.innerHTML}
          </div>
        </body>
      </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
    } catch (error) {
      console.error('Print operation failed:', error);
      try {
        printWindow.close();
      } catch (closeError) {
        console.error('Failed to close print window:', closeError);
      }
    }
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
      <DialogContent className="max-w-md w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Ricevuta di Garentille</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          {/* Preview of receipt */}
          <div className="text-center border-b pb-4">
            <h3 className="font-bold text-lg">GOLDEN PHONE</h3>
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
              <span>{clientName}</span>
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

          {/* Hidden receipt content for printing - Optimized compact thermal format */}
          <div id={`receipt-content-${sale.id}`} style={{display: 'none'}}>
            {/* Company Header - Compact */}
            <div style={{textAlign: 'center', marginBottom: '3mm', paddingBottom: '1mm', borderBottom: '1px solid #000'}}>
              <div style={{fontWeight: 'bold', fontSize: '8px', marginBottom: '0.5mm'}}>
                GOLDEN PHONE SRL
              </div>
              <div style={{fontSize: '5px', lineHeight: '1.1'}}>
                Corso Buenos Aires, 90 - Milano<br/>
                P.IVA: 12345678901 - Tel: 351.565.6095
              </div>
            </div>

            {/* Receipt Info - Compact */}
            <div style={{marginBottom: '3mm', fontSize: '5px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5mm'}}>
                <span>Ricevuta:</span>
                <span style={{fontWeight: 'bold'}}>{sale.sale_number}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5mm'}}>
                <span>Data:</span>
                <span>{format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Cliente:</span>
                <span>{clientName.length > 15 ? clientName.substring(0, 15) + '...' : clientName}</span>
              </div>
            </div>

            {/* Items Header */}
            <div style={{textAlign: 'center', fontWeight: 'bold', fontSize: '6px', marginBottom: '1mm', paddingBottom: '0.5mm', borderBottom: '1px solid #000'}}>
              ARTICOLI
            </div>

            {/* Items - Compact with max 5 items */}
            <div style={{marginBottom: '3mm', fontSize: '5px'}}>
              {sale.sale_items?.slice(0, 5).map((item, index) => (
                <div key={index} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5mm', alignItems: 'flex-start'}}>
                  <span style={{flex: '1', marginRight: '2mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '35mm'}}>
                    {item.product ? `${item.product.brand} ${item.product.model}`.substring(0, 25) : "Prodotto"}
                  </span>
                  <span style={{width: '8mm', textAlign: 'center', fontWeight: 'bold'}}>
                    {item.quantity}
                  </span>
                  <span style={{width: '15mm', textAlign: 'right', fontWeight: 'bold'}}>
                    €{item.total_price.toFixed(2)}
                  </span>
                </div>
              ))}
              {(sale.sale_items?.length || 0) > 5 && (
                <div style={{fontSize: '4px', textAlign: 'center', fontStyle: 'italic', marginTop: '1mm'}}>
                  +{(sale.sale_items?.length || 0) - 5} altri articoli
                </div>
              )}
            </div>

            {/* Totals - Compact */}
            <div style={{marginBottom: '3mm', paddingTop: '1mm', borderTop: '1px dashed #000'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '5px', marginBottom: '0.5mm'}}>
                <span>Subtotale:</span>
                <span>€{sale.subtotal.toFixed(2)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '5px', marginBottom: '0.5mm'}}>
                <span>IVA:</span>
                <span>€{sale.tax_amount.toFixed(2)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '7px', borderTop: '2px solid #000', paddingTop: '1mm', marginTop: '1mm'}}>
                <span>TOTALE:</span>
                <span>€{sale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method - Compact */}
            <div style={{marginBottom: '3mm', fontSize: '5px', textAlign: 'center', padding: '1mm 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000'}}>
              <span>Pagamento: </span>
              <span style={{fontWeight: 'bold'}}>
                {sale.payment_method === 'cash' ? 'CONTANTI' : 
                 sale.payment_method === 'card' ? 'CARTA' : 
                 sale.payment_method === 'bank_transfer' ? 'BONIFICO' : 'MISTO'}
              </span>
            </div>

            {/* QR Code - Smaller */}
            <div style={{textAlign: 'center', marginBottom: '2mm'}}>
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  style={{width: '20px', height: '20px', display: 'block', margin: '0 auto'}}
                />
              )}
            </div>

            {/* Footer - Compact */}
            <div style={{textAlign: 'center', fontSize: '4px', lineHeight: '1.1'}}>
              <div style={{fontWeight: 'bold', marginBottom: '0.5mm', fontSize: '5px'}}>
                GRAZIE PER LA VOSTRA VISITA!
              </div>
              <div style={{marginBottom: '0.5mm'}}>
                Garanzia: 12 mesi • Assistenza tecnica
              </div>
              <div>
                {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm")}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={handlePrint}
              disabled={isQrCodeGenerating}
              className="w-full"
            >
              {isQrCodeGenerating ? "Generando QR..." : "Stampa Ricevuta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}