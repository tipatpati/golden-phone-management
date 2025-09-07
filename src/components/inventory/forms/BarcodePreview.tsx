import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { ProductUnitsService } from "@/services/inventory/ProductUnitsService";
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
  return;
}