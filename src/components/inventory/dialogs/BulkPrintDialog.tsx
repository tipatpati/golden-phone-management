import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Settings, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  barcode?: string;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
}

interface BulkPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  isLoading?: boolean;
}

export function BulkPrintDialog({
  open,
  onOpenChange,
  products,
  isLoading = false
}: BulkPrintDialogProps) {
  const [copies, setCopies] = useState("1");
  const [labelSize, setLabelSize] = useState("medium");
  const [includePrice, setIncludePrice] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [labelFormat, setLabelFormat] = useState("sticker");
  const [companyName] = useState("GOLDEN PHONE SRL");

  const labelSizes = {
    small: { width: 200, height: 120, barcodeWidth: 1.5, barcodeHeight: 60 },
    medium: { width: 300, height: 200, barcodeWidth: 2, barcodeHeight: 80 },
    large: { width: 400, height: 280, barcodeWidth: 2.5, barcodeHeight: 100 }
  };

  const currentSize = labelSizes[labelSize as keyof typeof labelSizes];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Please allow popups to print labels",
        variant: "destructive"
      });
      return;
    }

    const copiesNum = parseInt(copies) || 1;
    
    const generateLabelContent = (product: Product) => {
      const productName = `${product.brand} ${product.model}${product.year ? ` (${product.year})` : ''}`;
      const barcode = product.barcode || generateSKUBasedBarcode(productName);
      
      return `
        <div class="label-content">
          <div class="text-xs font-bold mb-2 text-gray-700 uppercase tracking-wider">
            ${companyName}
          </div>
          
          <div class="text-lg font-bold mb-2 leading-tight">
            ${productName}
          </div>
          
          ${product.category ? `
            <div class="text-sm text-gray-600 mb-2">
              ${product.category.name}
            </div>
          ` : ''}

          ${includePrice ? `
            <div class="text-xl font-bold text-red-600 mb-3">
              €${product.price.toFixed(2)}
            </div>
          ` : ''}
          
          ${includeBarcode ? `
            <div class="barcode-container">
              <canvas class="barcode-canvas" data-barcode="${barcode}"></canvas>
            </div>
          ` : ''}
        </div>
      `;
    };

    let allLabels = '';
    products.forEach(product => {
      for (let i = 0; i < copiesNum; i++) {
        allLabels += `
          <div class="print-label">
            ${generateLabelContent(product)}
          </div>
        `;
      }
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Product Labels</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
          <style>
            @media print {
              @page {
                size: ${currentSize.width + 20}px ${currentSize.height + 20}px;
                margin: 10px;
              }
              
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .print-label {
                page-break-after: always;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
              }
              
              .print-label:last-child {
                page-break-after: avoid;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            
            .print-label {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: center;
              background: white;
              width: ${currentSize.width}px;
              height: ${currentSize.height}px;
              box-sizing: border-box;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .text-xs { font-size: 12px; line-height: 1rem; }
            .text-sm { font-size: 14px; line-height: 1.25rem; }
            .text-lg { font-size: 18px; line-height: 1.75rem; }
            .text-xl { font-size: 20px; line-height: 1.75rem; }
            .font-bold { font-weight: 700; }
            .mb-2 { margin-bottom: 6px; }
            .mb-3 { margin-bottom: 8px; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-red-600 { color: #dc2626; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .leading-tight { line-height: 1.25; }
            
            .label-content {
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: space-between;
              align-items: center;
            }
            
            .barcode-container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              flex: 1;
              margin: 4px 0;
            }
            
            canvas {
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${allLabels}
          <script>
            function initializeBarcodes() {
              if (typeof JsBarcode === 'undefined') {
                setTimeout(initializeBarcodes, 500);
                return;
              }
              
              const canvases = document.querySelectorAll('.barcode-canvas');
              
              canvases.forEach(function(canvas) {
                const barcodeValue = canvas.getAttribute('data-barcode');
                if (!barcodeValue) return;
                
                try {
                  JsBarcode(canvas, barcodeValue, {
                    format: 'CODE128',
                    width: ${currentSize.barcodeWidth},
                    height: ${currentSize.barcodeHeight},
                    displayValue: true,
                    fontSize: 12,
                    font: 'Arial',
                    textAlign: 'center',
                    textPosition: 'bottom',
                    margin: 8,
                    background: '#ffffff',
                    lineColor: '#000000'
                  });
                } catch (error) {
                  console.error('Barcode generation failed:', error);
                }
              });
            }
            
            window.addEventListener('load', function() {
              initializeBarcodes();
              setTimeout(function() {
                window.print();
              }, 1500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    toast({
      title: "Print Prepared",
      description: `Preparing to print ${products.length * copiesNum} labels`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Labels
          </DialogTitle>
          <DialogDescription>
            Print labels for {products.length} selected products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="copies">Copies per product</Label>
              <Input
                id="copies"
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
              />
            </div>

            <div>
              <Label>Label size</Label>
              <Select value={labelSize} onValueChange={setLabelSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (200×120)</SelectItem>
                  <SelectItem value="medium">Medium (300×200)</SelectItem>
                  <SelectItem value="large">Large (400×280)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Label format</Label>
            <Select value={labelFormat} onValueChange={setLabelFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sticker">Product Sticker</SelectItem>
                <SelectItem value="basic">Basic Label</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Include information</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-price"
                  checked={includePrice}
                  onCheckedChange={(checked) => setIncludePrice(checked === true)}
                />
                <Label htmlFor="include-price" className="text-sm">
                  Price
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-barcode"
                  checked={includeBarcode}
                  onCheckedChange={(checked) => setIncludeBarcode(checked === true)}
                />
                <Label htmlFor="include-barcode" className="text-sm">
                  Barcode
                </Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}