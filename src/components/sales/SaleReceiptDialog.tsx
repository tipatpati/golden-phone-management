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
export function SaleReceiptDialog({
  sale,
  open,
  onOpenChange
}: SaleReceiptDialogProps) {
  // Optimized client name calculation
  const clientName = useMemo(() => {
    if (!sale?.client) {
      return "Cliente Occasionale";
    }
    return sale.client.type === "business" ? sale.client.company_name : `${sale.client.first_name} ${sale.client.last_name}`;
  }, [sale?.client]);

  // QR code generation state
  const [qrCode, setQrCode] = React.useState<string>('');
  const [isQrCodeGenerating, setIsQrCodeGenerating] = React.useState<boolean>(false);

  // Generate QR code immediately and efficiently
  React.useEffect(() => {
    if (!sale) return;
    const generateQRCode = async () => {
      try {
        // Create simpler QR content for faster generation
        const qrContent = `GOLDEN TRADE Q&A SRL
${sale.sale_number}
${format(new Date(sale.sale_date), "yyyy-MM-dd")}
€${sale.total_amount.toFixed(2)}`;

        // Generate QR code with minimal settings for speed
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: 60,
          margin: 0,
          errorCorrectionLevel: 'L',
          // Low error correction for speed
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error('QR code generation failed:', error);
        // Create fallback QR code
        setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIzMCIgeT0iMzAiIGZpbGw9ImJsYWNrIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCI+UVI8L3RleHQ+Cjwvc3ZnPgo=');
      }
    };

    // Generate QR immediately without delay
    generateQRCode();
  }, [sale?.sale_number, sale?.sale_date, sale?.total_amount]);
  const handlePrint = async () => {
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
              font-size: 10.8px !important;
              line-height: 1.2 !important;
              margin: 0 !important;
              padding: 2mm !important;
              width: auto !important;
              max-width: none !important;
              height: auto !important;
              min-height: auto !important;
              color: #000 !important;
              background: white !important;
              overflow: visible !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            .receipt-container {
              width: auto !important;
              max-width: none !important;
              height: auto !important;
              min-height: auto !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: visible !important;
              page-break-inside: avoid !important;
            }
            .company-header {
              text-align: center !important;
              margin-bottom: 2mm !important;
              padding-bottom: 1mm !important;
              border-bottom: 1px solid #000 !important;
            }
            .company-name {
              font-size: 14.4px !important;
              font-weight: bold !important;
              margin-bottom: 0.5mm !important;
            }
            .company-details {
              font-size: 9px !important;
              line-height: 1.1 !important;
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
              font-size: 9px !important;
            }
            .items-header {
              margin: 1.5mm 0 1mm 0 !important;
              font-weight: bold !important;
              font-size: 10.8px !important;
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
              font-size: 9px !important;
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
              font-size: 9px !important;
            }
            .final-total {
              font-weight: bold !important;
              font-size: 12.6px !important;
              border-top: 2px solid #000 !important;
              padding-top: 1mm !important;
              margin-top: 1mm !important;
            }
            .payment-section {
              margin: 1.5mm 0 !important;
              padding: 1mm 0 !important;
              font-size: 9px !important;
              text-align: center !important;
              border-top: 1px dashed #000 !important;
              border-bottom: 1px dashed #000 !important;
            }
            .qr-section {
              text-align: center !important;
              margin: 2mm 0 1.5mm 0 !important;
            }
            .qr-code {
              width: 36px !important;
              height: 36px !important;
              margin: 0.5mm auto !important;
            }
            .footer {
              text-align: center !important;
              margin-top: 2mm !important;
              font-size: 7.2px !important;
              line-height: 1.1 !important;
            }
            .thank-you {
              font-weight: bold !important;
              margin-bottom: 0.5mm !important;
              font-size: 9px !important;
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Only show trigger if not controlled externally */}
      {!open && <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Receipt className="h-4 w-4" />
          </Button>
        </DialogTrigger>}
      <DialogContent className="max-w-md w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Ricevuta di Garentille</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          {/* Print-style preview */}
          <div className="bg-white border-2 border-gray-300 p-4 max-h-96 overflow-y-auto" style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          lineHeight: '1.2'
        }}>
            {/* Company Header */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #000'
          }}>
              <div style={{
              fontWeight: 'bold',
              fontSize: '16.8px',
              marginBottom: '2px',
              letterSpacing: '0.5px'
            }}>
                GOLDEN TRADE Q&A SRL
              </div>
              <div style={{
              fontSize: '11px',
              lineHeight: '1.3'
            }}>
                Corso Buenos Aires, 90,<br />
                20124 Milano - MI<br />
                P. IVA: 12345678901<br />
                Tel: +39 351 565 6095
              </div>
            </div>

            {/* Document Type */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            paddingBottom: '4px'
          }}>
              <div style={{
              fontWeight: 'bold',
              fontSize: '10.4px',
              marginBottom: '2px'
            }}>DOCUMENTO DI GARANZIA</div>
              
            </div>

            {/* Product Info */}
            <div style={{
            marginBottom: '8px',
            fontSize: '11px'
          }}>
              {sale.sale_items?.slice(0, 1).map((item, index) => <div key={index} style={{
              marginBottom: '4px'
            }}>
                  <div style={{
                fontWeight: 'bold',
                marginBottom: '2px',
                fontSize: '13px'
              }}>
                    {item.product?.brand || "Smartphone"}
                  </div>
                  <div style={{
                marginBottom: '1px'
              }}>
                    {item.product?.model || "iPhone 13 Pro Max"}
                  </div>
                  <div style={{
                marginBottom: '1px'
              }}>
                    SN: {item.serial_number || "359357621574578"}
                  </div>
                  <div style={{
                fontSize: '10px'
              }}>
                    Garanzia: 1 anno
                  </div>
                </div>)}
            </div>

            {/* Payment Details */}
            <div style={{
            marginBottom: '8px',
            fontSize: '10px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2px'
            }}>
                <span>Pagato con Carta:</span>
                <span>{sale.payment_method === 'card' ? sale.total_amount.toFixed(2) : '0.00'} €</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2px'
            }}>
                <span>Pagato in Contanti:</span>
                <span>{sale.payment_method === 'cash' ? sale.total_amount.toFixed(2) : '0.00'} €</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2px'
            }}>
                <span>Sconto:</span>
                <span>{(sale.discount_amount || 0).toFixed(2)} €</span>
              </div>
              <div style={{
              borderTop: '1px solid #000',
              paddingTop: '2px',
              marginTop: '4px'
            }}>
                <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '12px'
              }}>
                  <span>Totale:</span>
                  <span>{sale.total_amount.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px'
          }}>
              {qrCode && <img src={qrCode} alt="QR Code" style={{
              width: '60px',
              height: '60px',
              margin: '0 auto',
              border: '1px solid #000'
            }} />}
            </div>

            {/* Date and Time */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: '10px'
          }}>
              <div>{format(new Date(sale.sale_date), "yyyy-MM-dd HH:mm:ss")}</div>
            </div>

            {/* Legal Terms */}
            <div style={{
            fontSize: '9px',
            lineHeight: '2.24',
            marginBottom: '8px',
            textAlign: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontWeight: 'bold'
          }}>
              TUTTE LE VENDITE SONO<br />
              DEFINITIVE E NON RIMBORSABILI,<br />
              A MENO CHE IL<br />
              PRODOTTO NON SIA DANNEGGIATO.<br />
              IL PRODOTTO NON SIA<br />
              DANNEGGIATO. IL NEGOZIO NON<br />
              SI ASSUME RESPONSABILITÀ PER<br />
              EVENTUALI DANNI DERIVANTI DA<br />
              USO IMPROPRIO DEI PRODOTTI<br />
              ACQUISTATI. IL NEGOZIO HA<br />
              IL DIRITTO DI RIFIUTARE<br />
              QUALSIASI DANNEGGIAMENTO ARTICOLI<br />
              DANNEGGIATO E UTILIZZATI IN<br />
              MODO NON APPROPRIATO.
            </div>

            {/* Final Footer */}
            <div style={{
            textAlign: 'center',
            fontSize: '9px'
          }}>
              Questo documento non è<br />
              un documento fiscale.
            </div>
          </div>

          {/* Hidden receipt content for printing - Exact model from reference */}
          <div id={`receipt-content-${sale.id}`} style={{
          display: 'none'
        }}>
            {/* Company Header */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #000'
          }}>
              <div style={{
              fontWeight: 'bold',
              fontSize: '16.8px',
              marginBottom: '2px',
              letterSpacing: '0.5px'
            }}>
                GOLDEN TRADE Q&A SRL
              </div>
              <div style={{
              fontSize: '11px',
              lineHeight: '1.3'
            }}>
                Corso Buenos Aires, 90,<br />
                20124 Milano - MI<br />
                P. IVA: 12345678901<br />
                Tel: +39 351 565 6095
              </div>
            </div>

            {/* Document Type */}
            <div style={{
            textAlign: 'center',
            marginBottom: '8px',
            paddingBottom: '4px'
          }}>
              <div style={{
              fontWeight: 'bold',
              fontSize: '10.4px',
              marginBottom: '2px'
            }}>DOCUMENTO DI GARANZIA</div>
              
            </div>

            {/* Product Info */}
            <div style={{
            marginBottom: '8px',
            fontSize: '11px'
          }}>
              {sale.sale_items?.slice(0, 1).map((item, index) => <div key={index} style={{
              marginBottom: '2mm'
            }}>
                  <div style={{
                fontWeight: 'bold',
                marginBottom: '1mm',
                fontSize: '14.4px'
              }}>
                    {item.product?.brand || "Smartphone"}
                  </div>
                  <div style={{
                marginBottom: '0.5mm'
              }}>
                    {item.product?.model || "iPhone 13 Pro Max"}
                  </div>
                  <div style={{
                marginBottom: '0.5mm'
              }}>
                    SN: {item.serial_number || "359357621574578"}
                  </div>
                  <div style={{
                fontSize: '10.8px'
              }}>
                    Garanzia: 1 anno
                  </div>
                </div>)}
            </div>

            {/* Payment Details - Exact format */}
            <div style={{
            marginBottom: '4mm',
            fontSize: '10.8px'
          }}>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1mm'
            }}>
                <span>Pagato con Carta:</span>
                <span>{sale.payment_method === 'card' ? sale.total_amount.toFixed(2) : '0.00'} €</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1mm'
            }}>
                <span>Pagato in Contanti:</span>
                <span>{sale.payment_method === 'cash' ? sale.total_amount.toFixed(2) : '0.00'} €</span>
              </div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1mm'
            }}>
                <span>Sconto:</span>
                <span>{(sale.discount_amount || 0).toFixed(2)} €</span>
              </div>
              <div style={{
              borderTop: '1px solid #000',
              paddingTop: '1mm',
              marginTop: '2mm'
            }}>
                <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '12.6px'
              }}>
                  <span>Totale:</span>
                  <span>{sale.total_amount.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* QR Code - Centered */}
            <div style={{
            textAlign: 'center',
            marginBottom: '4mm',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
              {qrCode && <img src={qrCode} alt="QR Code" style={{
              width: '60px',
              height: '60px',
              display: 'block',
              margin: '0 auto',
              border: '1px solid #000'
            }} />}
            </div>

            {/* Date and Time */}
            <div style={{
            textAlign: 'center',
            marginBottom: '4mm',
            fontSize: '10.8px'
          }}>
              <div>{format(new Date(sale.sale_date), "yyyy-MM-dd HH:mm:ss")}</div>
            </div>

            {/* Legal Terms - Exact text */}
            <div style={{
            fontSize: '9px',
            lineHeight: '2.24',
            marginBottom: '4mm',
            textAlign: 'center',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            fontWeight: 'bold'
          }}>
              TUTTE LE VENDITE SONO<br />
              DEFINITIVE E NON RIMBORSABILI,<br />
              A MENO CHE IL<br />
              PRODOTTO NON SIA DANNEGGIATO.<br />
              IL PRODOTTO NON SIA<br />
              DANNEGGIATO. IL NEGOZIO NON<br />
              SI ASSUME RESPONSABILITÀ PER<br />
              EVENTUALI DANNI DERIVANTI DA<br />
              USO IMPROPRIO DEI PRODOTTI<br />
              ACQUISTATI. IL NEGOZIO HA<br />
              IL DIRITTO DI RIFIUTARE<br />
              QUALSIASI DANNEGGIAMENTO ARTICOLI<br />
              DANNEGGIATO E UTILIZZATI IN<br />
              MODO NON APPROPRIATO.
            </div>

            {/* Final Footer */}
            <div style={{
            textAlign: 'center',
            fontSize: '9px',
            marginTop: '3mm'
          }}>
              Questo documento non è<br />
              un documento fiscale.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button onClick={handlePrint} className="w-full">
              Stampa Ricevuta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}