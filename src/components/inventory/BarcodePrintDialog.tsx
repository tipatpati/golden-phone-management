import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarcodeGenerator } from './BarcodeGenerator';
import { Printer, Download, Copy, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { generateSKUBasedBarcode } from '@/utils/barcodeGenerator';
import { parseSerialWithBattery } from '@/utils/serialNumberUtils';

interface BarcodePrintDialogProps {
  productName: string;
  barcode?: string;
  sku: string;
  price: number;
  specifications?: string;
  companyName?: string;
  serialNumbers?: string[];
  trigger?: React.ReactNode;
  onBarcodeGenerated?: (barcode: string) => void;
}

export function BarcodePrintDialog({
  productName,
  barcode: initialBarcode,
  sku,
  price,
  specifications,
  companyName = "GOLDEN PHONE SRL",
  serialNumbers,
  trigger,
  onBarcodeGenerated
}: BarcodePrintDialogProps) {
  const [copies, setCopies] = useState("1");
  const [labelSize, setLabelSize] = useState("medium");
  const [includePrice, setIncludePrice] = useState(true);
  const [includeSKU, setIncludeSKU] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includeCompany, setIncludeCompany] = useState(true);
  const [labelFormat, setLabelFormat] = useState("sticker"); // "basic" or "sticker"
  const [isOpen, setIsOpen] = useState(false);
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBarcode(initialBarcode || '');
  }, [initialBarcode]);

  const labelSizes = {
    small: { width: 200, height: 120, barcodeWidth: 1.5, barcodeHeight: 60 },
    medium: { width: 300, height: 200, barcodeWidth: 2, barcodeHeight: 80 },
    large: { width: 400, height: 280, barcodeWidth: 2.5, barcodeHeight: 100 }
  };

  // Parse IMEI and battery information from serial numbers
  const imeiInfo = serialNumbers?.[0] ? parseSerialWithBattery(serialNumbers[0]) : null;
  const currentSize = labelSizes[labelSize as keyof typeof labelSizes];

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    
    if (!barcode) {
      toast.error('Please generate a barcode before printing');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    const printContent = printAreaRef.current.innerHTML;
    const copiesNum = parseInt(copies) || 1;

    let allLabels = '';
    for (let i = 0; i < copiesNum; i++) {
      allLabels += `<div class="print-label">${printContent}</div>`;
      if (i < copiesNum - 1) {
        allLabels += '<div class="page-break"></div>';
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode Labels - ${productName}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              .page-break {
                page-break-before: always;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              background: white;
            }
            
            .print-label {
              border: 1px solid #ddd;
              padding: 15px;
              margin: 5px;
              text-align: center;
              background: white;
              width: ${currentSize.width}px;
              min-height: ${currentSize.height}px;
              display: inline-block;
              vertical-align: top;
            }
            
            .company-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #333;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .product-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              line-height: 1.2;
              color: #000;
            }
            
            .imei-info {
              font-size: 12px;
              color: #333;
              margin-bottom: 8px;
              line-height: 1.4;
            }
            
            .imei-text {
              font-weight: 600;
              color: #000;
            }
            
            .battery-text {
              color: #16a34a;
              font-weight: 500;
            }
            
            .product-specs {
              font-size: 12px;
              color: #666;
              margin-bottom: 12px;
              line-height: 1.3;
            }
            
            .barcode-container {
              margin: 10px 0;
              display: flex;
              justify-content: center;
            }
            
            .product-info {
              margin-top: 10px;
              font-size: 12px;
              color: #666;
            }
            
            .price {
              font-size: 20px;
              font-weight: bold;
              color: #dc2626;
              margin-top: 8px;
              margin-bottom: 8px;
            }
            
            .sku {
              font-size: 10px;
              color: #888;
            }
            
            canvas {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${allLabels}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Small delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast.success(`Preparing to print ${copiesNum} label(s)`);
  };

  const handleDownload = () => {
    if (!printAreaRef.current) return;

    // Create a temporary canvas for each label
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on label size
    canvas.width = currentSize.width * 2; // Higher resolution
    canvas.height = currentSize.height * 2;
    ctx.scale(2, 2); // Scale for better quality

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, currentSize.width, currentSize.height);

    // Draw border
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(1, 1, currentSize.width - 2, currentSize.height - 2);

    // Draw product name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const words = productName.split(' ');
    let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    
    ctx.fillText(line1, currentSize.width / 2, 25);
    if (line2) {
      ctx.fillText(line2, currentSize.width / 2, 45);
    }

    // The barcode would need to be drawn here, but it's complex to do manually
    // For now, we'll show a message about using the print function
    toast.info('Use the Print button for best results. Download feature coming soon.');
  };

  const handleGenerateBarcode = async () => {
    setIsGeneratingBarcode(true);
    try {
      const newBarcode = generateSKUBasedBarcode(sku);
      setBarcode(newBarcode);
      onBarcodeGenerated?.(newBarcode);
      toast.success('Barcode generated successfully');
    } catch (error) {
      toast.error('Failed to generate barcode');
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleCopyBarcode = () => {
    if (!barcode) {
      toast.error('No barcode to copy');
      return;
    }
    navigator.clipboard.writeText(barcode).then(() => {
      toast.success('Barcode copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy barcode');
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Label
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Barcode Labels</DialogTitle>
          <DialogDescription>
            Configure and print barcode labels for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="copies">Number of copies</Label>
              <Input
                id="copies"
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
              />
            </div>

            <div>
              <Label>Label format</Label>
              <Select value={labelFormat} onValueChange={setLabelFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Label</SelectItem>
                  <SelectItem value="sticker">Product Sticker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Label size</Label>
              <Select value={labelSize} onValueChange={setLabelSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (200x120px)</SelectItem>
                  <SelectItem value="medium">Medium (300x200px)</SelectItem>
                  <SelectItem value="large">Large (400x280px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label contents</Label>
              {labelFormat === "sticker" && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeCompany"
                      checked={includeCompany}
                      onChange={(e) => setIncludeCompany(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeCompany" className="text-sm">Include company name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeSpecs"
                      checked={includeSpecs}
                      onChange={(e) => setIncludeSpecs(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeSpecs" className="text-sm">Include specifications</Label>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePrice"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="includePrice" className="text-sm">Include price</Label>
              </div>
              {labelFormat === "basic" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSKU"
                    checked={includeSKU}
                    onChange={(e) => setIncludeSKU(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="includeSKU" className="text-sm">Include SKU</Label>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!barcode && (
                <Button 
                  onClick={handleGenerateBarcode} 
                  variant="outline" 
                  size="sm"
                  disabled={isGeneratingBarcode}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isGeneratingBarcode ? 'Generating...' : 'Generate Barcode'}
                </Button>
              )}
              <Button onClick={handleCopyBarcode} variant="outline" size="sm" disabled={!barcode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Barcode
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Label preview</Label>
            <div 
              className="border rounded-lg p-4 bg-white flex justify-center"
              style={{ minHeight: currentSize.height + 40 }}
            >
              <div 
                ref={printAreaRef}
                className="text-center border border-gray-200 p-3 bg-white shadow-sm"
                style={{ 
                  width: currentSize.width, 
                  minHeight: currentSize.height 
                }}
              >
                {labelFormat === "sticker" ? (
                  <>
                    {includeCompany && (
                      <div className="text-xs font-bold mb-2 text-gray-700 uppercase tracking-wider">
                        {companyName}
                      </div>
                    )}
                    
                    <div className="text-lg font-bold mb-2 leading-tight">
                      {productName}
                    </div>
                    
                    {imeiInfo && (
                      <div className="text-sm text-gray-800 mb-2">
                        <div className="font-semibold">IMEI: {imeiInfo.serial}</div>
                        {imeiInfo.batteryLevel && (
                          <div className="text-green-600 font-medium">
                            Battery: {imeiInfo.batteryLevel}%
                          </div>
                        )}
                      </div>
                    )}

                    {includePrice && (
                      <div className="text-xl font-bold text-red-600 mb-3">
                        {price.toFixed(2)}€
                      </div>
                    )}
                    
                     <div className="my-3 flex justify-center">
                       {barcode ? (
                         <BarcodeGenerator
                           value={barcode}
                           width={currentSize.barcodeWidth}
                           height={currentSize.barcodeHeight}
                           displayValue={true}
                         />
                       ) : (
                         <div className="text-sm text-gray-500 border-2 border-dashed border-gray-300 p-4 rounded">
                           No barcode - Click "Generate Barcode" to create one
                         </div>
                       )}
                     </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold mb-2 leading-tight">
                      {productName}
                    </div>
                    
                     <div className="my-3 flex justify-center">
                       {barcode ? (
                         <BarcodeGenerator
                           value={barcode}
                           width={currentSize.barcodeWidth}
                           height={currentSize.barcodeHeight}
                           displayValue={true}
                         />
                       ) : (
                         <div className="text-sm text-gray-500 border-2 border-dashed border-gray-300 p-4 rounded">
                           No barcode - Generate one first
                         </div>
                       )}
                     </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      {includePrice && (
                        <div className="text-blue-600 font-semibold text-sm">
                          €{price.toFixed(2)}
                        </div>
                      )}
                      {includeSKU && (
                        <div className="text-gray-500 text-xs">
                          SKU: {sku}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={!barcode}>
            <Printer className="h-4 w-4 mr-2" />
            Print {copies} Label{parseInt(copies) !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}