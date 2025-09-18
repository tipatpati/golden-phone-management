import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { BarcodeRenderer } from './labels/services/BarcodeRenderer';

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
        // High-quality barcode generation with proper scaling
        const canvas = BarcodeRenderer.generateCanvas(value, {
          width,
          height,
          displayValue,
          context: 'preview'
        });
        
        // Replace current canvas content
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          canvasRef.current.style.width = canvas.style.width;
          canvasRef.current.style.height = canvas.style.height;
          ctx.drawImage(canvas, 0, 0);
        }
      } catch (error) {
        console.error('Failed to generate CODE128 barcode:', error);
        
        // Display error message on canvas
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = '#ff0000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Barcode Error', canvasRef.current.width / 2, canvasRef.current.height / 2);
        }
      }
    }
  }, [value, width, height, displayValue]);

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