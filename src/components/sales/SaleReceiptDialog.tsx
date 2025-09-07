import React, { useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { type Sale } from "@/services";
import { format } from "date-fns";
import QRCode from "qrcode";
import { ReceiptContent } from "./ReceiptContent";

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

  // Generate QR code only when dialog is open to prevent premature requests
  React.useEffect(() => {
    if (!sale || !open) return;
    
    let isCancelled = false;
    setIsQrCodeGenerating(true);
    
    const generateQRCode = async () => {
      try {
        // Create QR content with URL to PDF receipt
        const receiptUrl = `https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/generate-receipt-pdf?sale_id=${sale.id}`;
        
        // Generate QR code with minimal settings for speed
        const qrDataUrl = await QRCode.toDataURL(receiptUrl, {
          width: 60,
          margin: 0,
          errorCorrectionLevel: 'L',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        if (!isCancelled) {
          setQrCode(qrDataUrl);
          setIsQrCodeGenerating(false);
        }
      } catch (error) {
        console.error('QR code generation failed:', error);
        if (!isCancelled) {
          // Create fallback QR code
          setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIzMCIgeT0iMzAiIGZpbGw9ImJsYWNrIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCI+UVI8L3RleHQ+Cjwvc3ZnPgo=');
          setIsQrCodeGenerating(false);
        }
      }
    };

    generateQRCode();
    
    return () => {
      isCancelled = true;
    };
  }, [sale?.id, open]);

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
          {/* Print-style preview using unified component */}
          <div className="bg-white border-2 border-gray-300 p-4 max-h-96 overflow-y-auto" style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            lineHeight: '1.2'
          }}>
            <ReceiptContent 
              sale={sale} 
              qrCode={qrCode} 
              clientName={clientName}
            />
          </div>

          {/* Hidden receipt content for printing - using same unified component */}
          <div id={`receipt-content-${sale.id}`} style={{ display: 'none' }}>
            <ReceiptContent 
              sale={sale} 
              qrCode={qrCode} 
              clientName={clientName}
            />
          </div>

          {/* Print button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handlePrint}
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Stampa Ricevuta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}