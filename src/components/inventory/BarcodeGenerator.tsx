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
        JsBarcode(canvasRef.current, value, {
          format,
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