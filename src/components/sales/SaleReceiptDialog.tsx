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

  // QR code generation state
  const [qrCode, setQrCode] = React.useState<string>('');

  // Generate QR code
  React.useEffect(() => {
    if (!sale) return;
    
    const generateQRCode = async () => {
      console.log('🔄 Generating QR code for sale:', sale.sale_number);
      const start = performance.now();
      
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
        
        const duration = performance.now() - start;
        console.log(`⚡ QR code generated in ${duration.toFixed(2)}ms`);
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error('❌ QR code generation failed:', error);
        setQrCode('');
      }
    };

    generateQRCode();
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
        width: 80mm;
        max-width: 80mm;
        font-family: 'Courier New', monospace;
        font-size: 6px;
        line-height: 1.1;
        color: #000;
        background: white;
        padding: 2mm;
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
            width: 80mm !important;
            max-width: 80mm !important;
          }
          @page { size: 80mm auto; margin: 0; }
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
              size: 80mm auto;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 6px;
              line-height: 1.1;
              margin: 0;
              padding: 0;
              width: 80mm;
              max-width: 80mm;
              color: #000;
              background: white;
              overflow-x: hidden;
            }
            .receipt-container {
              width: 80mm;
              max-width: 80mm;
              padding: 2mm;
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
                width: 80mm;
                max-width: 80mm;
              }
              .receipt-container {
                width: 80mm;
                max-width: 80mm;
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

          {/* Hidden receipt content for printing - 8cm x 8cm thermal format */}
          <div id={`receipt-content-${sale.id}`} style={{display: 'none'}}>
            {/* Company Header */}
            <div style={{textAlign: 'center', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #000'}}>
              <div style={{fontWeight: 'bold', fontSize: '9px', marginBottom: '2px', letterSpacing: '0.3px'}}>
                GOLDEN TRADE Q&A SRL
              </div>
              <div style={{fontSize: '6px', lineHeight: '1.3'}}>
                Corso Buenos Aires, 90,<br/>
                20124 Milano - MI<br/>
                P. IVA: 12345678901<br/>
                Tel: +39 351 565 6095
              </div>
            </div>

            {/* Document Type */}
            <div style={{textAlign: 'center', marginBottom: '8px', paddingBottom: '4px'}}>
              <div style={{fontWeight: 'bold', fontSize: '8px', marginBottom: '2px'}}>DOCUMENTO DI</div>
              <div style={{fontWeight: 'bold', fontSize: '8px'}}>GARANZIA</div>
            </div>

            {/* Product Info */}
            <div style={{marginBottom: '8px'}}>
              {sale.sale_items?.map((item, index) => (
                <div key={index} style={{marginBottom: '6px', fontSize: '7px'}}>
                  <div style={{fontWeight: 'bold', marginBottom: '2px'}}>
                    {item.product ? `${item.product.brand}` : "Smartphone"}
                  </div>
                  <div style={{marginBottom: '1px'}}>
                    {item.product ? `${item.product.model}` : "Pro Max"}
                  </div>
                  <div style={{marginBottom: '1px'}}>
                    SN: {item.serial_number || "359357621574578"}
                  </div>
                  <div style={{fontSize: '6px'}}>
                    Garanzia: 1 anno
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div style={{marginBottom: '8px', fontSize: '6px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}>
                <span>Pagato con Carta:</span>
                <span>0.00 €</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}>
                <span>Pagato in Contanti:</span>
                <span>{sale.total_amount.toFixed(2)} €</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}>
                <span>Sconto:</span>
                <span>{(sale.discount_amount || 0).toFixed(2)} €</span>
              </div>
              <div style={{borderTop: '1px solid #000', paddingTop: '2px', marginTop: '4px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                  <span>Totale:</span>
                  <span>{sale.total_amount.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* QR Code centered */}
            <div style={{textAlign: 'center', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  style={{width: '50px', height: '50px', border: '1px solid #000', display: 'block', margin: '0 auto'}}
                />
              )}
            </div>

            {/* Date and Time */}
            <div style={{textAlign: 'center', marginBottom: '8px', fontSize: '6px'}}>
              <div>{format(new Date(sale.sale_date), "yyyy-MM-dd HH:mm:ss")}</div>
            </div>

            {/* Legal Terms */}
            <div style={{fontSize: '5px', lineHeight: '1.2', marginBottom: '8px', textAlign: 'justify'}}>
              TUTTE LE VENDITE SONO DEFINITIVE E NON RIMBORSABILI, A MENO CHE IL PRODOTTO NON SIA DANNEGGIATO.<br/>
              IL NEGOZIO NON SI ASSUME RESPONSABILITÀ PER EVENTUALI DANNI DERIVANTI DA USO IMPROPRIO DEI PRODOTTI ACQUISTATI.<br/>
              IL NEGOZIO HA IL DIRITTO DI RIFIUTARE QUALSIASI DANNEGGIAMENTO ARTICOLI DANNEGGIATO E UTILIZZATI IN MODO NON APPROPRIATO.
            </div>

            {/* Final Footer */}
            <div style={{textAlign: 'center', fontSize: '5px', marginTop: '8px'}}>
              Questo documento non è<br/>
              un documento fiscale.
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