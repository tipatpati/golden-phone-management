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
import { formatLabelElements } from "@/components/inventory/labels/services/labelDataFormatter";
import { generateSingleLabel } from "@/components/inventory/labels/services/templates";
import { generateLabelStyles } from "@/components/inventory/labels/services/styles";
import type { ThermalLabelData, ThermalLabelOptions } from "@/services/labels/types";

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

  // Convert SimpleLabelData to ThermalLabelData format
  const convertToThermalLabelData = (label: SimpleLabelData): ThermalLabelData => ({
    id: label.id,
    productName: label.productName,
    serialNumber: label.serialNumber,
    barcode: label.barcode,
    price: label.maxPrice,
    maxPrice: label.maxPrice,
    storage: label.storage,
    ram: label.ram,
    batteryLevel: label.batteryLevel
  });

  // Generate thermal label HTML using inventory system
  const generateLabelHTML = (labels: SimpleLabelData[]): string => {
    const options: ThermalLabelOptions & { companyName?: string; isSupplierLabel?: boolean } = {
      copies: 1,
      includePrice: true,
      includeBarcode: true,
      includeCompany: true,
      includeCategory: false,
      format: "standard",
      companyName,
      isSupplierLabel: true
    };

    const labelElements = labels.map(label => {
      const thermalLabel = convertToThermalLabelData(label);
      return generateSingleLabel(thermalLabel, options);
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thermal Labels</title>
        ${generateLabelStyles(options)}
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