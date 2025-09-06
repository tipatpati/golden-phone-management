import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { ProductUnitsService } from "@/services/products/ProductUnitsService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Download, Printer, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BarcodePreviewEntry {
  serial: string;
  barcode: string;
  isValid: boolean;
  type: 'unit' | 'product';
  color?: string;
  batteryLevel?: number;
}

interface BarcodePreviewProps {
  productId?: string;
  unitEntries?: Array<{
    serial: string;
    color?: string;
    battery_level?: number;
  }>;
  productBarcode?: string;
  hasSerial: boolean;
  className?: string;
}

export function BarcodePreview({
  productId,
  unitEntries = [],
  productBarcode,
  hasSerial,
  className = ""
}: BarcodePreviewProps) {
  const [barcodes, setBarcodes] = useState<BarcodePreviewEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBarcodes, setShowBarcodes] = useState(true);
  const [previewMode, setPreviewMode] = useState<'all' | 'units' | 'product'>('all');

  // Load existing barcodes for edit mode
  useEffect(() => {
    const loadExistingBarcodes = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {
        const units = await ProductUnitsService.getUnitsForProduct(productId);
        const unitBarcodes: BarcodePreviewEntry[] = units.map(unit => ({
          serial: unit.serial_number,
          barcode: unit.barcode || 'PENDING',
          isValid: !!unit.barcode && Code128GeneratorService.validateCode128(unit.barcode).isValid,
          type: 'unit' as const,
          color: unit.color,
          batteryLevel: unit.battery_level
        }));

        setBarcodes(unitBarcodes);
      } catch (error) {
        console.error('Failed to load existing barcodes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingBarcodes();
  }, [productId]);

  // Generate preview barcodes for new products
  useEffect(() => {
    const generatePreviewBarcodes = async () => {
      if (productId || !hasSerial || unitEntries.length === 0) return;

      setIsLoading(true);
      try {
        const previewBarcodes: BarcodePreviewEntry[] = [];

        for (const [index, entry] of unitEntries.entries()) {
          if (!entry.serial?.trim()) continue;

          // Generate a preview barcode (simulated)
          const mockBarcode = `GPMS${String(Date.now() + index).slice(-8)}`;
          const validation = Code128GeneratorService.validateCode128(mockBarcode);

          previewBarcodes.push({
            serial: entry.serial,
            barcode: mockBarcode,
            isValid: validation.isValid,
            type: 'unit',
            color: entry.color,
            batteryLevel: entry.battery_level
          });
        }

        setBarcodes(previewBarcodes);
      } catch (error) {
        console.error('Failed to generate preview barcodes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreviewBarcodes();
  }, [productId, hasSerial, unitEntries]);

  const handleRefreshBarcodes = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      await ProductUnitsService.backfillMissingBarcodes();
      toast({
        title: "Barcodes Updated",
        description: "Missing barcodes have been generated successfully."
      });
      
      // Reload the barcodes
      const units = await ProductUnitsService.getUnitsForProduct(productId);
      const unitBarcodes: BarcodePreviewEntry[] = units.map(unit => ({
        serial: unit.serial_number,
        barcode: unit.barcode || 'PENDING',
        isValid: !!unit.barcode && Code128GeneratorService.validateCode128(unit.barcode).isValid,
        type: 'unit' as const,
        color: unit.color,
        batteryLevel: unit.battery_level
      }));

      setBarcodes(unitBarcodes);
    } catch (error) {
      console.error('Failed to refresh barcodes:', error);
      toast({
        title: "Error",
        description: "Failed to refresh barcodes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintBarcodes = () => {
    // Open print dialog for barcode labels
    window.print();
  };

  const handleDownloadBarcodes = () => {
    // Generate CSV with barcode data
    const csvData = barcodes.map(b => ({
      Serial: b.serial,
      Barcode: b.barcode,
      Valid: b.isValid ? 'Yes' : 'No',
      Color: b.color || 'N/A',
      Battery: b.batteryLevel ? `${b.batteryLevel}%` : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcodes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBarcodes = barcodes.filter(b => {
    if (previewMode === 'units') return b.type === 'unit';
    if (previewMode === 'product') return b.type === 'product';
    return true;
  });

  if (!hasSerial && !productBarcode) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Barcode Preview
            <Badge variant={productId ? "default" : "secondary"}>
              {productId ? "Live" : "Preview"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBarcodes(!showBarcodes)}
            >
              {showBarcodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {productId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshBarcodes}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadBarcodes}
              disabled={barcodes.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrintBarcodes}
              disabled={barcodes.length === 0}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {barcodes.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant={previewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('all')}
            >
              All ({barcodes.length})
            </Button>
            <Button
              variant={previewMode === 'units' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('units')}
            >
              Units ({barcodes.filter(b => b.type === 'unit').length})
            </Button>
            {productBarcode && (
              <Button
                variant={previewMode === 'product' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('product')}
              >
                Product (1)
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading barcodes...</p>
          </div>
        ) : (
          <>
            {/* Product Barcode */}
            {productBarcode && (previewMode === 'all' || previewMode === 'product') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Product Barcode</h4>
                  <Badge variant="outline">Product</Badge>
                </div>
                {showBarcodes && (
                  <div className="border rounded-lg p-4 bg-background">
                    <BarcodeGenerator
                      value={productBarcode}
                      displayValue={true}
                      format="CODE128"
                      className="mx-auto"
                    />
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {productBarcode}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Unit Barcodes */}
            {filteredBarcodes.length > 0 && (previewMode === 'all' || previewMode === 'units') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Unit Barcodes</h4>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {filteredBarcodes.filter(b => b.isValid).length} Valid
                    </Badge>
                    <Badge variant="destructive">
                      {filteredBarcodes.filter(b => !b.isValid).length} Invalid
                    </Badge>
                  </div>
                </div>

                {showBarcodes && (
                  <div className="grid gap-3">
                    {filteredBarcodes.map((entry, index) => (
                      <div
                        key={`${entry.serial}-${index}`}
                        className="border rounded-lg p-3 space-y-3 bg-background"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Unit #{index + 1}
                            </span>
                            <Badge
                              variant={entry.isValid ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {entry.isValid ? "Valid" : "Invalid"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            CODE128
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div><strong>Serial:</strong> {entry.serial}</div>
                          {entry.color && (
                            <div><strong>Color:</strong> {entry.color}</div>
                          )}
                          {entry.batteryLevel !== undefined && (
                            <div><strong>Battery:</strong> {entry.batteryLevel}%</div>
                          )}
                        </div>

                        {entry.barcode !== 'PENDING' ? (
                          <div className="space-y-2">
                            <BarcodeGenerator
                              value={entry.barcode}
                              displayValue={true}
                              format="CODE128"
                              className="mx-auto"
                            />
                            <p className="text-xs text-center text-muted-foreground">
                              {entry.barcode}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-amber-600 text-sm">
                            ⏳ Barcode will be generated on save
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredBarcodes.length === 0 && !productBarcode && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No barcodes to display</p>
                <p className="text-xs mt-1">
                  {!hasSerial
                    ? "Enable serial numbers to generate unit barcodes"
                    : "Add serial numbers to see barcode previews"}
                </p>
              </div>
            )}

            {!productId && barcodes.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Preview Mode:</strong> These are sample barcodes. 
                  Final barcodes will be generated when the product is saved.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}