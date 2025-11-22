import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/updated-dialog';
import { Button } from '@/components/ui/updated-button';
import { Printer, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ExchangeTransaction } from '@/services/sales/exchanges/types';

interface ExchangeReceiptDialogProps {
  exchange: ExchangeTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExchangeReceiptDialog({
  exchange,
  open,
  onOpenChange,
}: ExchangeReceiptDialogProps) {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [isQrCodeGenerating, setIsQrCodeGenerating] = useState(false);

  const clientName = useMemo(() => {
    if (!exchange.client) return 'Cliente Generico';
    if (exchange.client.type === 'business') {
      return exchange.client.company_name || 'Azienda';
    }
    return `${exchange.client.first_name || ''} ${exchange.client.last_name || ''}`.trim() || 'Cliente';
  }, [exchange.client]);

  const generateQRCode = async () => {
    if (!exchange.id || isQrCodeGenerating) return;

    setIsQrCodeGenerating(true);
    try {
      const receiptUrl = `${window.location.origin}/receipt/exchange/${exchange.id}`;
      const qrDataUrl = await QRCode.toDataURL(receiptUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCode(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsQrCodeGenerating(false);
    }
  };

  useEffect(() => {
    if (open && exchange.id && !qrCode && !isQrCodeGenerating) {
      generateQRCode();
    }
  }, [open, exchange.id, qrCode, isQrCodeGenerating]);

  const capturePreviewHTML = () => {
    if (!previewRef.current) return '';

    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    const qrCodeScript = qrCode
      ? `<img src="${qrCode}" alt="QR Code" style="width: 60px; height: 60px; margin: 0 auto; border: 1px solid #000; display: block;" />`
      : '<div style="width: 60px; height: 60px; margin: 0 auto; border: 1px solid #000; display: flex; align-items: center; justify-content: center; fontSize: 8px;">QR</div>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${styles}</style>
      </head>
      <body>
        ${previewRef.current.innerHTML.replace(
          /<div[^>]*data-qr-placeholder[^>]*>.*?<\/div>/g,
          qrCodeScript
        )}
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Errore',
        description: 'Impossibile aprire la finestra di stampa',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = capturePreviewHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    try {
      toast({
        title: 'Generazione PDF',
        description: 'Generazione del PDF in corso...',
      });

      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200],
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cambio-${exchange.exchange_number}.pdf`);

      toast({
        title: 'PDF Scaricato',
        description: 'Il PDF è stato scaricato con successo',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante la generazione del PDF',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = () => {
    if (exchange.payment_method === 'hybrid') {
      const methods = [];
      if (exchange.cash_amount && exchange.cash_amount > 0) 
        methods.push(`Contanti: €${exchange.cash_amount.toFixed(2)}`);
      if (exchange.card_amount && exchange.card_amount > 0) 
        methods.push(`Carta: €${exchange.card_amount.toFixed(2)}`);
      if (exchange.bank_transfer_amount && exchange.bank_transfer_amount > 0)
        methods.push(`Bonifico: €${exchange.bank_transfer_amount.toFixed(2)}`);
      return methods.join(', ');
    }

    const labels = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico',
    };
    return labels[exchange.payment_method] || exchange.payment_method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ricevuta Cambio #{exchange.exchange_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <div
            ref={previewRef}
            className="bg-white text-black p-6 rounded-lg border"
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              maxWidth: '80mm',
              margin: '0 auto',
            }}
          >
            {/* Company Header */}
            <div className="text-center mb-4 pb-2 border-b-2 border-black">
              <div className="font-bold text-lg mb-1">PHONE REPAIR CENTER</div>
              <div className="text-xs leading-tight">
                Via Roma 123<br />
                00100 Roma (RM)<br />
                P. IVA: 12345678901<br />
                Tel: +39 06 12345678
              </div>
            </div>

            {/* Document Type */}
            <div className="text-center mb-4">
              <div className="font-bold text-base mb-1">RICEVUTA CAMBIO</div>
              <div className="text-sm">N. {exchange.exchange_number}</div>
              {clientName && (
                <div className="text-xs mt-2">Cliente: {clientName}</div>
              )}
            </div>

            {/* Trade-in Items Section */}
            <div className="mb-4 text-xs">
              <div className="font-bold text-sm mb-2 pb-1 border-b border-black">
                ARTICOLI RITIRATI:
              </div>
              <div className="border-b border-black mb-2" />
              
              {exchange.trade_in_items?.map((item, index) => (
                <div key={index} className="mb-3 pb-2 border-b border-dashed border-gray-300">
                  <div className="font-bold text-sm mb-1">
                    {item.brand} {item.model}
                  </div>
                  {item.serial_number && (
                    <div className="text-xs mb-1">SN: {item.serial_number}</div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span>Condizione: {item.condition}</span>
                    <span className="font-bold">€{item.assessed_value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between font-bold mt-2">
                <span>Totale Permuta:</span>
                <span>€{exchange.trade_in_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Purchase Items Section */}
            <div className="mb-4 text-xs">
              <div className="font-bold text-sm mb-2 pb-1 border-b border-black">
                ARTICOLI VENDUTI:
              </div>
              <div className="border-b border-black mb-2" />
              
              {/* Note: We'll need to fetch the actual sale items from the new_sale relation */}
              <div className="text-center text-gray-500 py-2">
                Dettagli vendita collegati alla ricevuta di vendita
              </div>
              
              <div className="flex justify-between font-bold mt-2">
                <span>Totale Acquisto:</span>
                <span>€{exchange.purchase_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-4 text-xs border-t-2 border-black pt-3">
              <div className="flex justify-between mb-1">
                <span>Totale Permuta:</span>
                <span className="font-bold">€{exchange.trade_in_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Totale Acquisto:</span>
                <span className="font-bold">€{exchange.purchase_total.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-gray-400 my-2" />
              
              {exchange.net_difference > 0 ? (
                <div className="flex justify-between font-bold text-sm text-red-600">
                  <span>Il cliente paga:</span>
                  <span>€{exchange.net_difference.toFixed(2)}</span>
                </div>
              ) : exchange.net_difference < 0 ? (
                <div className="flex justify-between font-bold text-sm text-green-600">
                  <span>Il cliente riceve:</span>
                  <span>€{Math.abs(exchange.net_difference).toFixed(2)}</span>
                </div>
              ) : (
                <div className="text-center font-bold text-sm">
                  Cambio alla pari
                </div>
              )}
              
              {exchange.net_difference !== 0 && (
                <div className="mt-2 text-xs">
                  <div className="font-bold mb-1">Metodo di pagamento:</div>
                  <div>{getPaymentMethodLabel()}</div>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="text-center mb-4" data-qr-placeholder>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-16 h-16 mx-auto border border-black"
                />
              )}
            </div>

            {/* Date and Time */}
            <div className="text-center mb-4 text-xs">
              <div>{formatDate(exchange.exchange_date)}</div>
            </div>

            {/* Legal Terms */}
            <div className="text-xs text-center mb-4 px-4 font-bold">
              <p className="m-0">
                Prodotti usati non coperti da garanzia. Il presente documento non costituisce fattura fiscale.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs">
              Documento non fiscale
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outlined" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Stampa Ricevuta
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Scarica PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
