import React, { useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Download } from "lucide-react";
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

  // QR code generation state with race condition protection
  const [qrCode, setQrCode] = React.useState<string>('');
  const [isQrCodeGenerating, setIsQrCodeGenerating] = React.useState<boolean>(false);
  const qrGenerationTimeoutRef = useRef<number | null>(null);

  // Debounced QR code generation to prevent race conditions
  const generateQRCode = React.useCallback(async (saleId: string) => {
    if (isQrCodeGenerating) return;
    
    setIsQrCodeGenerating(true);
    
    try {
      // Create QR content with URL to PDF receipt
      const receiptUrl = `https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/generate-receipt-pdf?sale_id=${saleId}`;
      
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
      
      setQrCode(qrDataUrl);
    } catch (error) {
      console.error('QR code generation failed:', error);
      // Create fallback QR code
      setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIzMCIgeT0iMzAiIGZpbGw9ImJsYWNrIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCI+UVI8L3RleHQ+Cjwvc3ZnPgo=');
    } finally {
      setIsQrCodeGenerating(false);
    }
  }, [isQrCodeGenerating]);

  // Generate QR code only when dialog is open with debouncing
  useEffect(() => {
    if (!sale?.id || !open || qrCode) return;
    
    // Clear any existing timeout
    if (qrGenerationTimeoutRef.current) {
      clearTimeout(qrGenerationTimeoutRef.current);
    }
    
    // Debounce QR generation to prevent race conditions
    qrGenerationTimeoutRef.current = window.setTimeout(() => {
      generateQRCode(sale.id);
    }, 300);
    
    return () => {
      if (qrGenerationTimeoutRef.current) {
        clearTimeout(qrGenerationTimeoutRef.current);
      }
    };
  }, [sale?.id, open, qrCode, generateQRCode]);

  const handlePrint = async () => {
    const receiptId = `receipt-content-${sale.id}`;
    const receiptContent = document.getElementById(receiptId);
    if (!receiptContent) {
      console.error('Receipt content not found');
      return;
    }

    // Create print window with exact same content and styles as preview
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
              margin: 0;
            }
            body {
              margin: 0;
              padding: 8px;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
              background: white;
              color: black;
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/generate-receipt-pdf?sale_id=${sale.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ricevuta-${sale.sale_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      // You could add a toast notification here
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

          {/* Action buttons */}
          <div className="flex gap-2 justify-center pt-4">
            <Button 
              onClick={handlePrint}
              variant="outline"
              className="flex-1 max-w-xs"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Stampa Ricevuta
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="flex-1 max-w-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Scarica PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}