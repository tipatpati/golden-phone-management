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
  format = 'CODE128',
  className = ''
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        // Auto-detect format based on barcode length and content
        let detectedFormat = format;
        if (format === 'EAN13') {
          // For EAN13, check if it's exactly 13 digits and has valid check digit
          if (value.length !== 13 || !/^\d{13}$/.test(value)) {
            detectedFormat = 'CODE128';
          } else {
            // Validate EAN13 check digit
            const checkDigit = value.slice(-1);
            const partial = value.slice(0, -1);
            let sum = 0;
            for (let i = 0; i < partial.length; i++) {
              const digit = parseInt(partial[i]);
              sum += digit * ((i % 2 === 0) ? 1 : 3);
            }
            const calculatedCheck = ((10 - (sum % 10)) % 10).toString();
            if (checkDigit !== calculatedCheck) {
              detectedFormat = 'CODE128';
            }
          }
        }

        JsBarcode(canvasRef.current, value, {
          format: detectedFormat,
          width,
          height,
          displayValue,
          fontSize: 14,
          fontOptions: 'bold',
          font: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 6,
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
            fontOptions: 'bold',
            font: 'Arial',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 6,
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