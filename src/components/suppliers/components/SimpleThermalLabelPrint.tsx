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

  // Generate simple thermal label HTML
  const generateLabelHTML = (labels: SimpleLabelData[]): string => {
    const labelElements = labels.map(label => `
      <div class="thermal-label">
        <div class="company-header">${companyName.toUpperCase()}</div>
        <div class="product-info">
          <div class="product-name">${label.productName.toUpperCase()}</div>
          <div class="serial">SN: ${label.serialNumber}</div>
        </div>
        <div class="price-section">
          <div class="price">€${label.maxPrice.toFixed(2)}</div>
        </div>
        <div class="barcode-section">
          <div class="barcode-placeholder">${label.barcode}</div>
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
          @page { margin: 0; size: 6cm 5cm; }
          body { margin: 0; font-family: Arial, sans-serif; }
          .thermal-label {
            width: 6cm;
            height: 5cm;
            border: 1px solid #ddd;
            padding: 8px;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .company-header {
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 4px;
          }
          .product-info {
            flex: 1;
            text-align: center;
          }
          .product-name {
            font-size: 12px;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 2px;
          }
          .serial {
            font-size: 10px;
            margin-bottom: 4px;
          }
          .price-section {
            text-align: center;
            margin: 4px 0;
          }
          .price {
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 2px 8px;
            display: inline-block;
          }
          .barcode-section {
            text-align: center;
          }
          .barcode-placeholder {
            font-family: 'Courier New', monospace;
            font-size: 8px;
            background: #f0f0f0;
            padding: 2px;
            border: 1px solid #ccc;
          }
        </style>
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