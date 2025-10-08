import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code128GeneratorService } from '@/services/barcodes';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { logger } from "@/utils/logger";
export function BarcodeTestTool() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testBarcodes, setTestBarcodes] = useState<string[]>([]);
  const generateTestBarcodes = async () => {
    setIsGenerating(true);
    try {
      const testIds = ['test1', 'test2', 'test3', 'test4', 'test5'];
      const barcodes = await Promise.all(testIds.map(id => Code128GeneratorService.generateUnitBarcode(id)));
      setTestBarcodes(barcodes);
      toast.success(`Generated ${barcodes.length} test barcodes`);

      // Generate test barcodes for verification
      logger.info('Test barcodes generated', {
        count: barcodes.length
      }, 'BarcodeTestTool');
    } catch (error) {
      console.error('Failed to generate test barcodes:', error);
      toast.error('Failed to generate test barcodes');
    } finally {
      setIsGenerating(false);
    }
  };
  const copyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    toast.success('Barcode copied to clipboard');
  };
  return;
}