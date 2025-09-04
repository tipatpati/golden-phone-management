import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { generateIMEIBarcode, BarcodeOptions } from '@/utils/barcodeGenerator';
import { validateIMEI } from '@/utils/imeiValidation';
import { validateGS1Compliance } from '@/utils/gs1BarcodeGenerator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface EnhancedBarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  format?: 'AUTO' | 'GTIN-13' | 'CODE128';
  className?: string;
  showValidation?: boolean;
  barcodeOptions?: BarcodeOptions;
}

export function EnhancedBarcodeGenerator({
  value,
  width = 2,
  height = 100,
  displayValue = true,
  format = 'AUTO',
  className = '',
  showValidation = true,
  barcodeOptions = { format: 'AUTO' }
}: EnhancedBarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) {
      setError('No value provided');
      return;
    }

    try {
      setError(null);
      
      // Generate enhanced barcode with GS1 compliance
      const options: BarcodeOptions = {
        format: format as any,
        ...barcodeOptions
      };
      
      const result = generateIMEIBarcode(value, options);
      setBarcodeResult(result);

      // Use consistent format detection for rendering
      let renderFormat = result.format;
      if (renderFormat === 'GTIN-13') {
        renderFormat = 'EAN13' as any;
      }

      // Generate the barcode image with consistent settings
      JsBarcode(canvasRef.current, result.barcode, {
        format: renderFormat as any,
        width: 1.8,
        height: 55,
        displayValue: false,
        fontSize: 10,
        fontOptions: 'bold',
        font: 'Arial, sans-serif',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 4,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000'
      });

    } catch (err) {
      console.error('Error generating enhanced barcode:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setBarcodeResult(null);
    }
  }, [value, width, height, displayValue, format, barcodeOptions]);

  if (!value) {
    return null;
  }

  const imeiValidation = validateIMEI(value);
  const isGS1Compliant = barcodeResult?.isGS1Compliant || false;

  return (
    <div className={`space-y-2 ${className}`}>
      <canvas ref={canvasRef} />
      
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {showValidation && barcodeResult && (
        <div className="flex flex-wrap gap-2">
          {/* Format Badge */}
          <Badge variant="outline" className="text-xs">
            {barcodeResult.format}
          </Badge>
          
          {/* GS1 Compliance Badge */}
          <Badge 
            variant={isGS1Compliant ? "default" : "secondary"} 
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isGS1Compliant ? 'GS1 Compliant' : 'Standard Format'}
          </Badge>
          
          {/* IMEI Validation Badge */}
          {value.replace(/\D/g, '').length === 15 && (
            <Badge 
              variant={imeiValidation.isValid ? "default" : "destructive"} 
              className="text-xs"
            >
              {imeiValidation.isValid ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid IMEI
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Invalid IMEI
                </>
              )}
            </Badge>
          )}
        </div>
      )}
      
      {showValidation && barcodeResult?.metadata && (
        <div className="text-xs text-muted-foreground space-y-1">
          {barcodeResult.metadata.companyPrefix && (
            <div>Company Prefix: {barcodeResult.metadata.companyPrefix}</div>
          )}
          {barcodeResult.metadata.itemReference && (
            <div>Item Reference: {barcodeResult.metadata.itemReference}</div>
          )}
          {barcodeResult.metadata.applicationIdentifiers && (
            <div>
              <details className="cursor-pointer">
                <summary className="hover:text-foreground">GS1 Application Identifiers</summary>
                <div className="mt-1 pl-4 space-y-1">
                  {Object.entries(barcodeResult.metadata.applicationIdentifiers).map(([ai, value]) => (
                    <div key={ai}>AI({ai}): {String(value)}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}