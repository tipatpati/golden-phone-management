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
  
  return (
    <div className="bg-background rounded-xl shadow-xl p-4 sm:p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Barcode Test Generator</h3>
          <p className="text-sm text-muted-foreground">Generate test barcodes for verification</p>
        </div>
        <Button onClick={generateTestBarcodes} disabled={isGenerating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Generate Test Barcodes
        </Button>
      </div>
      {testBarcodes.length > 0 && (
        <div className="space-y-2">
          {testBarcodes.map((barcode, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="font-mono">{barcode}</Badge>
              <Button variant="text" size="sm" onClick={() => copyBarcode(barcode)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}