import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  format?: 'EAN13' | 'CODE128' | 'CODE39';
  className?: string;
}

export function BarcodeGenerator({
  value,
  width = 2,
  height = 100,
  displayValue = true,
  format = 'EAN13',
  className = ''
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        // Auto-detect format based on barcode length and content
        let detectedFormat = format;
        if (format === 'EAN13' && value.length !== 13) {
          // If it's not 13 digits, use CODE128 which is more flexible
          detectedFormat = 'CODE128';
        } else if (format === 'EAN13' && !/^\d+$/.test(value)) {
          // If it contains non-numeric characters, use CODE128
          detectedFormat = 'CODE128';
        }

        JsBarcode(canvasRef.current, value, {
          format: detectedFormat,
          width,
          height,
          displayValue,
          fontSize: 14,
          textMargin: 5,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
        // Fallback to CODE128 if EAN13 fails
        try {
          JsBarcode(canvasRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize: 14,
            textMargin: 5,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000'
          });
        } catch (fallbackError) {
          console.error('Fallback barcode generation also failed:', fallbackError);
        }
      }
    }
  }, [value, width, height, displayValue, format]);

  if (!value) {
    return null;
  }

  return (
    <canvas 
      ref={canvasRef}
      className={className}
    />
  );
}