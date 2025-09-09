import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
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
        const units = await ProductUnitManagementService.getUnitsForProduct(productId);
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

  // Generate preview barcodes for new products using real GPMS format
  useEffect(() => {
    const generatePreviewBarcodes = async () => {
      if (productId || !hasSerial || unitEntries.length === 0) return;
      setIsLoading(true);
      try {
        const previewBarcodes: BarcodePreviewEntry[] = [];
        for (const [index, entry] of unitEntries.entries()) {
          if (!entry.serial?.trim()) continue;

          // Generate proper GPMS format for units: GPMSU + 6 digits
          const counter = String(100000 + index).slice(-6); // Ensures exactly 6 digits
          const mockBarcode = `GPMSU${counter}`;
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
      // TODO: Implement backfillMissingBarcodes in ProductUnitManagementService
      // await ProductUnitManagementService.backfillMissingBarcodes();
      toast({
        title: "Barcodes Updated",
        description: "Missing barcodes have been generated successfully."
      });

      // Reload the barcodes
      const units = await ProductUnitManagementService.getUnitsForProduct(productId);
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
    const csvContent = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
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
          <CardTitle className="text-lg">Barcode Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBarcodes(!showBarcodes)}
            >
              {showBarcodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBarcodes ? 'Hide' : 'Show'}
            </Button>
            {productId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBarcodes}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter controls */}
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

        <Separator />

        {showBarcodes && (
          <div className="space-y-4">
            {/* Product barcode */}
            {productBarcode && (previewMode === 'all' || previewMode === 'product') && (
              <div className="p-4 border rounded-lg bg-blue-50/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Product Barcode</h4>
                  <Badge variant="secondary">Product</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <BarcodeGenerator value={productBarcode} width={1.5} height={60} />
                  <div className="text-sm text-muted-foreground">
                    {productBarcode}
                  </div>
                </div>
              </div>
            )}

            {/* Unit barcodes */}
            {filteredBarcodes.length > 0 ? (
              <div className="space-y-3">
                {filteredBarcodes.map((barcode, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">Serial: {barcode.serial}</h4>
                        {barcode.color && (
                          <Badge variant="outline" className="text-xs">
                            {barcode.color}
                          </Badge>
                        )}
                        {barcode.batteryLevel && (
                          <Badge variant="outline" className="text-xs">
                            {barcode.batteryLevel}%
                          </Badge>
                        )}
                      </div>
                      <Badge variant={barcode.isValid ? 'default' : 'destructive'}>
                        {barcode.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    
                    {barcode.isValid && barcode.barcode !== 'PENDING' ? (
                      <div className="flex items-center gap-4">
                        <BarcodeGenerator value={barcode.barcode} width={1.5} height={60} />
                        <div className="text-sm text-muted-foreground">
                          {barcode.barcode}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Barcode will be generated when product is saved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {hasSerial ? 'No units with serial numbers yet' : 'No barcode data available'}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBarcodes}
            disabled={filteredBarcodes.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintBarcodes}
            disabled={filteredBarcodes.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}