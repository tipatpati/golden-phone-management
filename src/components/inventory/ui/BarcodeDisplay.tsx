import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy } from "lucide-react";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { toast } from "@/components/ui/sonner";

interface BarcodeDisplayProps {
  value: string;
  label?: string;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Reusable barcode display component
 * Handles barcode generation, copying, and printing functionality
 */
export function BarcodeDisplay({
  value,
  label,
  showCopyButton = true,
  showPrintButton = true,
  size = "md",
  className
}: BarcodeDisplayProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Barcode copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy barcode");
    }
  };

  const handlePrint = () => {
    // Create a new window for printing just the barcode
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                font-family: Arial, sans-serif; 
              }
              .barcode-container { 
                text-align: center; 
                margin-bottom: 10px; 
              }
              .barcode-text { 
                font-size: 12px; 
                margin-top: 5px; 
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${label ? `<div style="font-weight: bold; margin-bottom: 10px;">${label}</div>` : ''}
              <div id="barcode"></div>
              <div class="barcode-text">${value}</div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
              window.onload = function() {
                JsBarcode("#barcode", "${value}", {
                  format: "CODE128",
                  width: 2,
                  height: 100,
                  displayValue: false
                });
                setTimeout(() => window.print(), 100);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const sizeConfig = {
    sm: { width: 150, height: 60 },
    md: { width: 200, height: 80 },
    lg: { width: 250, height: 100 }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        {label && (
          <div className="text-sm font-medium text-center">{label}</div>
        )}
        
        <div className="flex justify-center">
          <BarcodeGenerator 
            value={value} 
            width={sizeConfig[size].width}
            height={sizeConfig[size].height}
          />
        </div>
        
        <div className="text-xs text-center text-muted-foreground font-mono">
          {value}
        </div>
        
        {(showCopyButton || showPrintButton) && (
          <div className="flex gap-2">
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
            {showPrintButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}