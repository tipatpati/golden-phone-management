/**
 * SIMPLE THERMAL LABEL PRINT COMPONENT
 * Clean UI for thermal label printing with direct data display
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Eye, Package } from "lucide-react";
import { useSimpleThermalLabels, type SimpleLabelData } from "../hooks/useSimpleThermalLabels";
import { toast } from "sonner";

interface SimpleThermalLabelPrintProps {
  transactionIds: string[];
  companyName?: string;
}

export function SimpleThermalLabelPrint({ 
  transactionIds, 
  companyName = "TechShop" 
}: SimpleThermalLabelPrintProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  const { data: labels = [], isLoading, error } = useSimpleThermalLabels(transactionIds);

  // Generate thermal label HTML matching inventory design
  const generateLabelHTML = (labels: SimpleLabelData[]): string => {
    const labelElements = labels.map(label => `
      <div class="thermal-label">
        <!-- Header Section -->
        <div class="label-header">
          <div class="company-header">
            ${companyName.toUpperCase()}
          </div>
        </div>

        <!-- Main Content Section -->
        <div class="main-content">
          <!-- Product Name - Primary focus -->
          <div class="product-name">
            ${label.productName.toUpperCase()}
          </div>
          
          <!-- Serial Number Section -->
          <div class="serial-section">
            SN: ${label.serialNumber}
          </div>
        </div>

        <!-- Price Section -->
        <div class="price-section">
          €${label.maxPrice.toFixed(2)}
        </div>

        <!-- Barcode Section -->
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${label.barcode}"></canvas>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thermal Labels</title>
        <style>
          @media print {
            @page {
              margin: 10px;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 10px;
            }

            .thermal-label {
              width: 6cm !important;
              height: 3cm !important;
              margin: 0 !important;
              padding: 4px !important;
              border: none !important;
              background: white !important;
              box-sizing: border-box !important;
              page-break-after: always;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              font-family: Arial, sans-serif !important;
              overflow: hidden !important;
            }

            .company-header {
              font-size: 7px !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              color: #000 !important;
              letter-spacing: 0.3px !important;
              line-height: 1.0 !important;
              text-align: center !important;
              border-bottom: 1px solid #e5e5e5 !important;
              padding-bottom: 2px !important;
              margin-bottom: 2px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .label-header {
              min-height: 16px !important;
              border-bottom: 1px solid #e5e5e5 !important;
              padding-bottom: 1px !important;
              margin-bottom: 2px !important;
              overflow: hidden !important;
            }

            .main-content {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              gap: 2px !important;
              min-height: 0 !important;
              overflow: hidden !important;
            }

            .product-name {
              font-size: 11px !important;
              line-height: 1.0 !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.2px !important;
              color: #000 !important;
              text-align: center !important;
              max-height: 22px !important;
              overflow: hidden !important;
              display: -webkit-box !important;
              -webkit-line-clamp: 2 !important;
              -webkit-box-orient: vertical !important;
              word-break: break-word !important;
            }

            .serial-section {
              font-size: 7px !important;
              font-weight: 600 !important;
              color: #000 !important;
              text-align: center !important;
              letter-spacing: 0.1px !important;
              line-height: 1.0 !important;
              margin-top: 1px !important;
            }

            .price-section {
              font-size: 14px !important;
              font-weight: 700 !important;
              color: #000 !important;
              text-align: center !important;
              margin-top: 2px !important;
              letter-spacing: 0.2px !important;
              line-height: 1.0 !important;
              border-top: 2px solid #000 !important;
              margin-bottom: 2px !important;
              padding: 2px 0 !important;
            }

            .barcode-container {
              margin-top: 2px !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              background-color: #ffffff !important;
            }

            .barcode-canvas {
              max-width: 200px !important;
              height: 50px !important;
              display: block !important;
              margin: 0 !important;
            }

            .thermal-label:last-child {
              page-break-after: avoid;
            }
          }

          .thermal-label {
            width: 227px;  /* 6cm */
            height: 113px; /* 3cm */
            border: 1px solid #ddd;
            padding: 3px;
            background: white;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin: 10px;
            font-family: Arial, sans-serif;
          }

          .label-header {
            min-height: 16px;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 1px;
            margin-bottom: 2px;
            text-align: center;
            overflow: hidden;
          }

          .company-header {
            font-size: 8px;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.0;
            text-align: center;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .product-name {
            font-size: 16px;
            font-weight: 800;
            line-height: 1.0;
            color: #000;
            text-align: center;
            margin-bottom: 1px;
            max-height: 50px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            word-break: break-word;
            hyphens: auto;
          }

          .serial-section {
            font-size: 10px;
            font-weight: 600;
            color: #000;
            text-align: center;
            margin-top: 2px;
            letter-spacing: 0.1px;
          }

          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            background-color: #ffffff;
            padding: 2px;
            min-height: 55px;
            max-height: 55px;
            overflow: hidden;
          }

          .barcode-canvas {
            display: block;
            margin: 0 auto;
            max-width: 200px;
            height: 50px;
          }

          .price-section {
            font-size: 24px;
            font-weight: 900;
            color: #000;
            text-align: center;
            margin-top: 0;
            padding: 2px 0;
            letter-spacing: 0.3px;
            border-top: 2px solid #000;
          }

          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          window.addEventListener('load', function() {
            const barcodeCanvases = document.querySelectorAll('.barcode-canvas');
            barcodeCanvases.forEach(function(canvas) {
              const barcodeValue = canvas.getAttribute('data-barcode');
              if (barcodeValue) {
                try {
                  JsBarcode(canvas, barcodeValue, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: true,
                    fontSize: 8,
                    fontOptions: "bold",
                    font: "Arial",
                    textAlign: "center",
                    textPosition: "bottom",
                    textMargin: 2,
                    margin: 2,
                    background: "#ffffff",
                    lineColor: "#000000"
                  });
                } catch (error) {
                  console.error('Barcode generation failed:', error);
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#ff0000';
                  ctx.font = '8px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText('Barcode Error', canvas.width / 2, canvas.height / 2);
                }
              }
            });
          });
        </script>
      </head>
      <body>
        ${labelElements}
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!labels.length) {
      toast.error("No labels to print");
      return;
    }

    setIsPrinting(true);
    try {
      const html = generateLabelHTML(labels);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        toast.success(`Printed ${labels.length} thermal labels`);
      } else {
        toast.error("Could not open print window");
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error("Failed to print labels");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePreview = async () => {
    if (!labels.length) {
      toast.error("No labels to preview");
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const html = generateLabelHTML(labels);
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(html);
        previewWindow.document.close();
        toast.success("Preview opened in new window");
      } else {
        toast.error("Could not open preview window");
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error("Failed to generate preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Loading Labels...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Labels</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load thermal label data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Thermal Labels
          <Badge variant="secondary">{labels.length} labels</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Labels Summary */}
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {labels.slice(0, 5).map((label) => (
            <div key={label.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
              <div>
                <span className="font-medium">{label.productName}</span>
                <span className="text-muted-foreground ml-2">SN: {label.serialNumber}</span>
              </div>
              <span className="font-bold">€{label.maxPrice.toFixed(2)}</span>
            </div>
          ))}
          {labels.length > 5 && (
            <div className="text-center text-sm text-muted-foreground">
              +{labels.length - 5} more labels...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            variant="outline"
            disabled={!labels.length || isGeneratingPreview}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isGeneratingPreview ? "Generating..." : "Preview"}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!labels.length || isPrinting}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? "Printing..." : "Print Labels"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}