import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { formatLabelElements, getBarcodeConfig } from "./services/labelDataFormatter";
import { logger } from "@/utils/logger";
interface ThermalLabelPreviewProps {
  label: ThermalLabelData;
  options: ThermalLabelOptions & {
    companyName?: string;
  };
}
export function ThermalLabelPreview({
  label,
  options
}: ThermalLabelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formattedLabel = formatLabelElements(label, options);
  const barcodeConfig = getBarcodeConfig();

  useEffect(() => {
    if (canvasRef.current && options.includeBarcode && label.barcode) {
      try {
        logger.debug('Generating barcode for thermal label', { barcode: label.barcode }, 'ThermalLabelPreview');
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions for better rendering
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = 200;
        const displayHeight = 50;
        
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // Scale context for high DPI displays
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, displayWidth, displayHeight);
        }
        
        // Generate barcode with unified settings matching print service
        JsBarcode(canvas, label.barcode, {
          format: 'CODE128',
          width: 1.8,
          height: 40,
          displayValue: true,
          fontSize: 7,
          fontOptions: 'bold',
          font: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
          marginTop: 2,
          marginBottom: 2,
          marginLeft: 8,
          marginRight: 8
        });
        
        logger.debug('Barcode generated successfully', { barcode: label.barcode }, 'ThermalLabelPreview');
      } catch (error) {
        logger.error('Barcode generation failed', { barcode: label.barcode, error }, 'ThermalLabelPreview');
        
        // Fallback: Draw error message on canvas
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ff0000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Barcode Error', canvas.width / 2, canvas.height / 2);
          ctx.fillStyle = '#000000';
          ctx.font = '10px Arial';
          ctx.fillText(label.barcode || 'No barcode', canvas.width / 2, canvas.height / 2 + 15);
        }
      }
    } else {
      logger.debug('Barcode not rendered', {
        hasCanvas: !!canvasRef.current,
        includeBarcode: options.includeBarcode,
        barcode: label.barcode
      }, 'ThermalLabelPreview');
    }
  }, [label.barcode, options.includeBarcode]);

  // Professional thermal label styling - 6cm × 3cm landscape (227px × 113px)
  const labelStyle = {
    width: '227px',   // 6cm
    height: '113px',  // 3cm
    border: '2px solid hsl(var(--border))',
    borderRadius: '4px',
    padding: '3px',
    margin: '8px',
    fontSize: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    textAlign: 'center' as const,
    lineHeight: '1.1',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: 'var(--elevation-2)',
    position: 'relative' as const,
    gap: '1px'
  };
  return <div style={labelStyle}>
      {/* Zone 1: Header - 18px (0.5cm) */}
      <div style={{
        height: '18px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {formattedLabel.companyName && (
          <div style={{
            fontSize: '8px',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#000',
            letterSpacing: '0.4px',
            lineHeight: '1.0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formattedLabel.companyName}
          </div>
        )}
      </div>

      {/* Zone 2: Content - 65px (1.7cm) */}
      <div style={{
        height: '65px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '3px',
        overflow: 'hidden',
        padding: '3px 0'
      }}>
        {/* Product Name - 12px bold, max 2 lines */}
        <div style={{
          fontSize: '12px',
          fontWeight: '700',
          lineHeight: '1.1',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          maxHeight: '26px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
          textAlign: 'center'
        }}>
          {formattedLabel.productName}
        </div>
        
        {/* Specifications - 10px medium, single line with bullet separators */}
        {(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) && (
          <div style={{
            fontSize: '10px',
            fontWeight: '500',
            color: '#333',
            textAlign: 'center',
            lineHeight: '1.0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {[formattedLabel.storage, formattedLabel.ram, formattedLabel.batteryLevel]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
        
        {/* Serial Number - 9px condensed */}
        {formattedLabel.serialNumber && (
          <div style={{
            fontSize: '9px',
            fontWeight: '600',
            color: '#000',
            textAlign: 'center',
            letterSpacing: '0.2px',
            lineHeight: '1.0'
          }}>
            {formattedLabel.serialNumber}
          </div>
        )}

        {/* Price - 16px bold, prominent */}
        {options.includePrice && (
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#000',
            textAlign: 'center',
            marginTop: '2px',
            letterSpacing: '0.3px',
            lineHeight: '1.0'
          }}>
            {(() => {
              const maxPrice = (label as any).maxPrice;
              return (maxPrice !== undefined && maxPrice !== null && typeof maxPrice === 'number') 
                ? `€${maxPrice.toFixed(2)}` 
                : '';
            })()}
          </div>
        )}
      </div>

      {/* Zone 3: Barcode - 30px (0.8cm) with proper quiet zones */}
      {formattedLabel.barcode && (
        <div style={{
          height: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef} 
            style={{
              maxWidth: '207px', // 5.5cm for barcode + quiet zones
              height: '28px',
              display: 'block'
            }} 
          />
        </div>
      )}
    </div>;
}