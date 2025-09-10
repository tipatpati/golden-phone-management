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
      const barcodes = await Promise.all(
        testIds.map(id => Code128GeneratorService.generateUnitBarcode(id))
      );
      
      setTestBarcodes(barcodes);
      toast.success(`Generated ${barcodes.length} test barcodes`);
      
      // Generate test barcodes for verification
      logger.info('Test barcodes generated', { count: barcodes.length }, 'BarcodeTestTool');
      
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
    <div className="p-4 border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Barcode Test Tool</h3>
          <p className="text-sm text-muted-foreground">
            Generate sample barcodes to verify uniqueness
          </p>
        </div>
        
        <Button
          onClick={generateTestBarcodes}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate Test Barcodes'}
        </Button>
      </div>
      
      {testBarcodes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Generated Barcodes:</h4>
          <div className="grid gap-2">
            {testBarcodes.map((barcode, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <Badge variant="outline" className="font-mono">
                  {barcode}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyBarcode(barcode)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <strong>Uniqueness Check:</strong> {new Set(testBarcodes).size === testBarcodes.length 
              ? '✅ All barcodes are unique' 
              : '❌ Duplicate barcodes detected!'}
          </div>
        </div>
      )}
    </div>
  );
}