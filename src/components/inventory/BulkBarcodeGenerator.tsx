import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useProducts, useUpdateProduct } from '@/services/useProducts';
import { generateSKUBasedBarcode } from '@/utils/barcodeGenerator';
import { toast } from '@/components/ui/sonner';
import { Barcode, RefreshCw, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function BulkBarcodeGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  
  const { data: allProducts = [] } = useProducts('');
  const updateProduct = useUpdateProduct();
  
  const productsWithoutBarcodes = allProducts.filter(product => !product.barcode);

  const generateBarcodesForAll = async () => {
    if (productsWithoutBarcodes.length === 0) {
      toast.info('All products already have barcodes');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProcessedCount(0);

    const total = productsWithoutBarcodes.length;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsWithoutBarcodes.length; i++) {
      const product = productsWithoutBarcodes[i];
      
      try {
        const firstSerial = product.serial_numbers?.[0] || product.name;
        const newBarcode = generateSKUBasedBarcode(firstSerial, product.id);
        
        await updateProduct.mutateAsync({
          id: product.id,
          product: {
            barcode: newBarcode
          }
        });
        
        successCount++;
      } catch (error) {
        console.error(`Failed to generate barcode for ${product.name}:`, error);
        errorCount++;
      }
      
      const newProgress = Math.round(((i + 1) / total) * 100);
      setProgress(newProgress);
      setProcessedCount(i + 1);
      
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGenerating(false);
    
    if (successCount > 0) {
      toast.success(`Generated barcodes for ${successCount} products`);
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to generate barcodes for ${errorCount} products`);
    }

    if (successCount === total) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Barcode className="h-4 w-4" />
          Generate Missing Barcodes
          {productsWithoutBarcodes.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {productsWithoutBarcodes.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Generate Barcodes
          </DialogTitle>
          <DialogDescription>
            Generate unique barcodes for products that don't have them yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {productsWithoutBarcodes.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                All products already have barcodes!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm">
                  Found <strong>{productsWithoutBarcodes.length}</strong> products without barcodes:
                </p>
                
                <div className="max-h-40 overflow-y-auto space-y-1 bg-muted/30 rounded p-3">
                  {productsWithoutBarcodes.slice(0, 10).map(product => (
                    <div key={product.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{product.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.serial_numbers?.[0] || product.id.slice(0, 8)}
                      </Badge>
                    </div>
                  ))}
                  {productsWithoutBarcodes.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{productsWithoutBarcodes.length - 10} more
                    </div>
                  )}
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating barcodes...</span>
                    <span>{processedCount}/{productsWithoutBarcodes.length}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={generateBarcodesForAll}
                  disabled={isGenerating || productsWithoutBarcodes.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Barcode className="h-4 w-4 mr-2" />
                      Generate All
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}