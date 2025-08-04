import React, { useEffect, useRef, useMemo } from "react";
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
  const renderCount = useRef(0);
  const printCount = useRef(0);
  
  // 🔍 DEBUG: Track component lifecycle
  useEffect(() => {
    renderCount.current += 1;
    console.group(`🔍 SaleReceiptDialog Render #${renderCount.current}`);
    console.log('📊 Props:', { 
      saleId: sale?.id, 
      saleNumber: sale?.sale_number,
      open, 
      hasOnOpenChange: !!onOpenChange 
    });
    console.log('📈 Memory usage:', {
      heapUsed: (performance as any).memory?.usedJSHeapSize || 'N/A',
      heapTotal: (performance as any).memory?.totalJSHeapSize || 'N/A'
    });
    console.groupEnd();

    return () => {
      console.log(`🧹 SaleReceiptDialog cleanup for sale #${sale?.sale_number}`);
    };
  }, [sale?.id, sale?.sale_number, open, onOpenChange]);

  // 🚀 OPTIMIZED: Memoize client name calculation
  const clientName = useMemo(() => {
    console.log('🔄 Calculating client name for:', sale?.client);
    const start = performance.now();
    
    let result;
    if (!sale?.client) {
      result = "Cliente Occasionale";
    } else {
      result = sale.client.type === "business" 
        ? sale.client.company_name 
        : `${sale.client.first_name} ${sale.client.last_name}`;
    }
    
    const duration = performance.now() - start;
    console.log(`⚡ Client name calculated in ${duration.toFixed(2)}ms:`, result);
    return result;
  }, [sale?.client]);

  // 🚀 OPTIMIZED: Memoize QR code generation
  const qrCodeDataUrl = useMemo(() => {
    if (!sale) return '';
    
    console.log('🔄 Generating QR code for sale:', sale.sale_number);
    const start = performance.now();
    
    try {
      const qrContent = `PHONE PLANET|Ricevuta: ${sale.sale_number}|Data: ${format(new Date(sale.sale_date), "dd/MM/yyyy")}|Totale: €${sale.total_amount.toFixed(2)}`;
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
          <rect width="80" height="80" fill="white"/>
          <rect x="10" y="10" width="60" height="60" fill="none" stroke="black" stroke-width="2"/>
          <text x="40" y="45" text-anchor="middle" font-size="8" fill="black">QR CODE</text>
        </svg>
      `;
      const result = `data:image/svg+xml;base64,${btoa(svgString)}`;
      
      const duration = performance.now() - start;
      console.log(`⚡ QR code generated in ${duration.toFixed(2)}ms, size: ${result.length} chars`);
      return result;
    } catch (error) {
      console.error('❌ QR code generation failed:', error);
      return '';
    }
  }, [sale?.sale_number, sale?.sale_date, sale?.total_amount]);

  const handlePrint = () => {
    printCount.current += 1;
    console.group(`🖨️ Print Operation #${printCount.current} for sale ${sale.sale_number}`);
    
    const startTime = performance.now();
    const receiptId = `receipt-content-${sale.id}`;
    
    console.log('🔍 Looking for receipt element with ID:', receiptId);
    const receiptContent = document.getElementById(receiptId);
    
    if (!receiptContent) {
      console.error('❌ Receipt content not found with ID:', receiptId);
      console.log('📋 Available elements with receipt-content prefix:', 
        Array.from(document.querySelectorAll('[id^="receipt-content"]')).map(el => el.id)
      );
      console.groupEnd();
      return;
    }
    
    console.log('✅ Receipt content found, size:', receiptContent.innerHTML.length, 'chars');

    // Check if we're in an iframe (Lovable preview)
    const isInIframe = window !== window.parent;
    console.log('🔍 Environment check:', { isInIframe });
    
    if (isInIframe) {
      // Iframe-safe printing using browser's native print
      console.log('🔄 Using iframe-safe print method...');
      
      // Create a temporary container for printing
      const printContainer = document.createElement('div');
      printContainer.innerHTML = receiptContent.innerHTML;
      printContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 58mm;
        max-width: 58mm;
        font-family: 'Courier New', monospace;
        font-size: 5px;
        line-height: 0.9;
        color: #000;
        background: white;
        padding: 1mm;
        z-index: 10000;
        overflow: hidden;
      `;
      
      // Add print styles
      const printStyles = document.createElement('style');
      printStyles.textContent = `
        @media print {
          body * { visibility: hidden; }
          #print-container, #print-container * { visibility: visible; }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm !important;
            max-width: 58mm !important;
          }
          @page { size: 58mm auto; margin: 0; }
        }
      `;
      
      printContainer.id = 'print-container';
      document.head.appendChild(printStyles);
      document.body.appendChild(printContainer);
      
      // Trigger print
      window.print();
      
      // Cleanup after print
      setTimeout(() => {
        document.head.removeChild(printStyles);
        document.body.removeChild(printContainer);
        console.log('🧹 Print cleanup completed');
      }, 1000);
      
      const duration = performance.now() - startTime;
      console.log(`⚡ Iframe print completed in ${duration.toFixed(2)}ms`);
      console.groupEnd();
      return;
    }

    // Original print window method for regular browsers
    console.log('🔄 Using print window method...');
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('❌ Could not open print window - popup blocked?');
      console.groupEnd();
      return;
    }
    
    console.log('✅ Print window opened successfully');
    
    try {
      const htmlContent = `
      <html>
        <head>
          <title>Ricevuta #${sale.sale_number}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 5px;
              line-height: 0.9;
              margin: 0;
              padding: 0;
              width: 58mm;
              max-width: 58mm;
              color: #000;
              background: white;
              overflow-x: hidden;
            }
            .receipt-container {
              width: 58mm;
              max-width: 58mm;
              padding: 1mm;
              margin: 0;
              overflow: hidden;
            }
            .company-header {
              text-align: center;
              margin-bottom: 4px;
              padding-bottom: 2px;
              border-bottom: 1px solid #000;
            }
            .company-name {
              font-size: 7px;
              font-weight: bold;
              margin-bottom: 1px;
              letter-spacing: 0.3px;
            }
            .company-details {
              font-size: 4px;
              line-height: 1.0;
              margin-bottom: 0;
            }
            .receipt-info {
              margin: 3px 0;
              padding: 2px 0;
              border-bottom: 1px dashed #000;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              font-size: 5px;
              font-weight: normal;
            }
            .items-header {
              margin: 3px 0 2px 0;
              font-weight: bold;
              font-size: 5px;
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 1px;
            }
            .items-section {
              margin: 3px 0;
              padding: 1px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              font-size: 4px;
              align-items: flex-start;
            }
            .item-desc {
              flex: 1;
              margin-right: 2px;
              word-wrap: break-word;
              max-width: 35mm;
              overflow: hidden;
            }
            .item-qty {
              width: 6mm;
              text-align: center;
              font-weight: bold;
            }
            .item-price {
              width: 12mm;
              text-align: right;
              font-weight: bold;
            }
            .totals-section {
              margin-top: 3px;
              padding-top: 2px;
              border-top: 1px dashed #000;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              font-size: 5px;
            }
            .final-total {
              font-weight: bold;
              font-size: 6px;
              border-top: 2px solid #000;
              padding-top: 1px;
              margin-top: 1px;
            }
            .payment-section {
              margin: 3px 0;
              padding: 2px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            .qr-section {
              text-align: center;
              margin: 4px 0 3px 0;
            }
            .qr-code {
              width: 25px;
              height: 25px;
              margin: 1px auto;
            }
            .footer {
              text-align: center;
              margin-top: 3px;
              font-size: 4px;
              line-height: 1.1;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 1px;
              font-size: 5px;
            }
            @media print {
              body { 
                width: 58mm;
                max-width: 58mm;
              }
              .receipt-container {
                width: 58mm;
                max-width: 58mm;
              }
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
      
      const duration = performance.now() - startTime;
      console.log(`⚡ Print window operation completed in ${duration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Print operation failed:', error);
      try {
        printWindow.close();
      } catch (closeError) {
        console.error('❌ Failed to close print window:', closeError);
      }
    }
    
    console.groupEnd();
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

          {/* Hidden receipt content for printing */}
          <div id={`receipt-content-${sale.id}`} style={{display: 'none'}}>
            <div className="company-header">
              <div className="company-name">PHONE PLANET</div>
              <div className="company-details">
                di AMIRALI MOHAMADALI<br/>
                Via Example 123, Roma<br/>
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
                <span>{clientName}</span>
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
              <div className="item-row" style={{fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '1px', marginBottom: '2px'}}>
                <span className="item-desc">DESCRIZIONE</span>
                <span className="item-qty">Q</span>
                <span className="item-price">PREZZO</span>
              </div>
              {sale.sale_items?.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-desc">
                    {item.product ? `${item.product.brand} ${item.product.model}${item.product.year ? ` (${item.product.year})` : ''}` : "Prodotto"}
                    {item.serial_number && <div style={{fontSize: '4px', color: '#666'}}>S/N: {item.serial_number}</div>}
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
                <span>Metodo:</span>
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
                    <span>Ricevuti:</span>
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
                <div style={{fontWeight: 'bold', marginBottom: '1px'}}>Note:</div>
                <div style={{fontSize: '5px'}}>{sale.notes}</div>
              </div>
            )}

            <div className="qr-section">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code" 
                className="qr-code"
              />
              <div style={{fontSize: '4px', marginTop: '1px'}}>
                Scansiona per info
              </div>
            </div>

            <div className="footer">
              <div className="thank-you">GRAZIE!</div>
              <div>Arrivederci e a presto</div>
              <div style={{marginTop: '2px', fontSize: '4px'}}>
                Documento non fiscale<br/>
                Stampato: {format(new Date(), "dd/MM/yyyy HH:mm")}
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