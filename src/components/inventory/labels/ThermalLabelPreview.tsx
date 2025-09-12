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
        
        // Generate barcode with proper settings
        JsBarcode(canvas, label.barcode, {
          format: 'CODE128',
          width: 1.8,
          height: 35,
          displayValue: true,
          fontSize: 10,
          fontOptions: 'bold',
          font: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 4,
          margin: 5,
          background: '#ffffff',
          lineColor: '#000000',
          marginTop: 2,
          marginBottom: 2,
          marginLeft: 10,
          marginRight: 10
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

  // Professional thermal label styling - 6cm × 5cm landscape (227px × 189px)
  const labelStyle = {
    width: '227px',   // 6cm
    height: '189px',  // 5cm
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
      {/* Header Section */}
      <div style={{
      minHeight: '16px',
      borderBottom: '1px solid #e5e5e5',
      paddingBottom: '1px',
      marginBottom: '2px',
      overflow: 'hidden'
    }}>
        {formattedLabel.companyName && <div style={{
        fontSize: '8px',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: 'hsl(var(--primary))',
        letterSpacing: '0.5px',
        lineHeight: '1.0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
            {formattedLabel.companyName}
          </div>}
      </div>

      {/* Main Content Section */}
      <div style={{
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '2px',
      minHeight: '0',
      overflow: 'hidden'
    }}>
        {/* Product Name with Storage/RAM - Primary focus */}
        <div style={{
        fontSize: '16px',
        fontWeight: '800',
        lineHeight: '1.0',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
        maxHeight: '50px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        hyphens: 'auto',
        textAlign: 'center'
      }}>
          {formattedLabel.productName}
          {(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) && (
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              marginTop: '1px',
              color: '#333'
            }}>
              {formattedLabel.storage}
              {formattedLabel.storage && (formattedLabel.ram || formattedLabel.batteryLevel) && ' • '}
              {formattedLabel.ram}
              {formattedLabel.ram && formattedLabel.batteryLevel && ' • '}
              {formattedLabel.batteryLevel}
            </div>
          )}
        </div>
        
        {/* Serial Number Section */}
        {formattedLabel.serialNumber && <div style={{
        fontSize: '10px',
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginTop: '2px',
        letterSpacing: '0.1px'
      }}>
          {formattedLabel.serialNumber}
        </div>}
      </div>

      {/* Price Section */}
      {options.includePrice && <div style={{
      fontSize: '24px',
      fontWeight: '900',
      color: '#000',
      textAlign: 'center',
      padding: '2px 0',
      borderTop: '2px solid #000',
      marginBottom: '2px',
      letterSpacing: '0.3px',
      lineHeight: '1.0'
    }}>
          {(() => {
            // Only show maxPrice, leave blank if not available
            const maxPrice = (label as any).maxPrice;
            return (maxPrice !== undefined && maxPrice !== null && typeof maxPrice === 'number') 
              ? `€${maxPrice.toFixed(2)}` 
              : '';
          })()}
        </div>}

      {/* Barcode Section */}
      {formattedLabel.barcode && <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '55px',
      maxHeight: '55px',
      backgroundColor: '#ffffff',
      padding: '2px',
      overflow: 'hidden'
    }}>
          <canvas 
            ref={canvasRef} 
            style={{
              maxWidth: '200px',
              height: '50px',
              display: 'block'
            }} 
          />
        </div>}

    </div>;
}