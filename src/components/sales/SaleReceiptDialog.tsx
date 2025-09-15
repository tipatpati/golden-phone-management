import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Download } from "lucide-react";
import { type Sale } from "@/services";
import QRCode from "qrcode";
import { ReceiptContent } from "./ReceiptContent";
import { supabase } from "@/integrations/supabase/client";
import { apiConfig } from "@/config/api";

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
  const previewRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = React.useState<string>('');
  const [isQrCodeGenerating, setIsQrCodeGenerating] = React.useState<boolean>(false);

  // Client name calculation
  const clientName = React.useMemo(() => {
    if (!sale?.client) {
      return "Cliente Occasionale";
    }
    return sale.client.type === "business" ? sale.client.company_name : `${sale.client.first_name} ${sale.client.last_name}`;
  }, [sale?.client]);

  // Generate actual QR code for the receipt
  const generateQRCode = React.useCallback(async (saleId: string) => {
    if (isQrCodeGenerating) return;
    
    setIsQrCodeGenerating(true);
    
    try {
      // Create QR content with URL to the receipt
      const receiptUrl = `${apiConfig.functions.captureAndConvert}?sale_id=${saleId}`;
      
      // Generate actual QR code
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

  // Generate QR code when dialog opens
  React.useEffect(() => {
    if (open && sale?.id && !qrCode && !isQrCodeGenerating) {
      generateQRCode(sale.id);
    }
  }, [open, sale?.id, qrCode, isQrCodeGenerating, generateQRCode]);

  const capturePreviewHTML = (): string => {
    if (!previewRef.current) {
      throw new Error('Preview not found');
    }

    // Get the actual rendered HTML with all computed styles
    const previewElement = previewRef.current;
    const clonedElement = previewElement.cloneNode(true) as HTMLElement;
    
    // Apply the exact same styles as preview
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ricevuta #${sale.sale_number}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
          <style>
            @page { 
              margin: 0; 
              size: 80mm auto;
            }
            body { 
              margin: 0; 
              padding: 8px; 
              font-family: 'Courier New', monospace; 
              font-size: 11px; 
              line-height: 1.2; 
              background: white; 
              color: black; 
              width: 300px;
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${clonedElement.innerHTML}
          <script>
            // Generate QR code if needed
            window.addEventListener('load', function() {
              const qrPlaceholders = document.querySelectorAll('[data-qr-url]');
              qrPlaceholders.forEach(placeholder => {
                const url = placeholder.getAttribute('data-qr-url');
                if (url && window.QRCode) {
                  const canvas = document.createElement('canvas');
                  QRCode.toCanvas(canvas, url, {
                    width: 60,
                    margin: 0,
                    errorCorrectionLevel: 'L',
                    color: {
                      dark: '#000000',
                      light: '#FFFFFF'
                    }
                  }, function(error) {
                    if (!error) {
                      placeholder.innerHTML = '';
                      placeholder.appendChild(canvas);
                    }
                  });
                }
              });
            });
          </script>
        </body>
      </html>
    `;

    return fullHTML;
  };

  const handlePrint = async () => {
    try {
      const htmlContent = capturePreviewHTML();
      
      // Create print window with the exact HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print receipts');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a moment for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 2000); // Increased delay for QR code generation

    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const htmlContent = capturePreviewHTML();
      
      // Use the unified capture-and-convert service
      const { data, error } = await supabase.functions.invoke('capture-and-convert', {
        body: {
          html: htmlContent,
          type: 'pdf',
          filename: `ricevuta-${sale.sale_number}`,
          sale_id: sale.id
        }
      });

      if (error) {
        throw error;
      }

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
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
      alert('PDF download failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {/* THE SINGLE SOURCE OF TRUTH - This is what gets printed/converted to PDF */}
          <div 
            ref={previewRef}
            className="bg-white border-2 border-gray-300 p-4 max-h-96 overflow-y-auto" 
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '11px',
              lineHeight: '1.2',
              width: '300px',
              margin: '0 auto'
            }}
          >
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