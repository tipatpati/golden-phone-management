import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { formatLabelElements, getBarcodeConfig } from "./services/labelDataFormatter";
import { BarcodeRenderer } from "./services/BarcodeRenderer";
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
        
        // Use high-quality barcode renderer for crisp preview
        const highQualityCanvas = BarcodeRenderer.generateCanvas(label.barcode, {
          width: 200,
          height: 50,
          quality: 'high',
          displayValue: true,
          fontSize: 7
        });
        
        // Copy the high-quality canvas to our ref
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = highQualityCanvas.width;
          canvas.height = highQualityCanvas.height;
          canvas.style.width = highQualityCanvas.style.width;
          canvas.style.height = highQualityCanvas.style.height;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(highQualityCanvas, 0, 0);
        }
        
        logger.debug('High-quality barcode generated successfully', { barcode: label.barcode }, 'ThermalLabelPreview');
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
    padding: '4px',
    margin: '8px',
    fontSize: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '1.1',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: 'var(--elevation-2)',
    position: 'relative' as const
  };
  return (
    <div style={labelStyle}>
      {/* Header Section */}
      {options.includeCompany && formattedLabel.companyName && (
        <div style={{
          fontSize: '7px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: '#000',
          letterSpacing: '0.3px',
          lineHeight: '1.0',
          textAlign: 'center',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '2px',
          marginBottom: '2px'
        }}>
          {formattedLabel.companyName}
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px'
      }}>
        {/* Product Name */}
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          lineHeight: '1.0',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.2px',
          textAlign: 'center',
          maxHeight: '22px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word'
        }}>
          {formattedLabel.productName}
        </div>
        
        {/* Specifications */}
        {(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) && (
          <div style={{
            fontSize: '8px',
            fontWeight: '500',
            color: '#555',
            textAlign: 'center',
            lineHeight: '1.0'
          }}>
            {[formattedLabel.storage, formattedLabel.ram, formattedLabel.batteryLevel]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
        
        {/* Serial Number */}
        {formattedLabel.serialNumber && (
          <div style={{
            fontSize: '7px',
            fontWeight: '600',
            color: '#000',
            textAlign: 'center',
            letterSpacing: '0.1px',
            lineHeight: '1.0',
            marginTop: '1px'
          }}>
            SN: {formattedLabel.serialNumber}
          </div>
        )}

        {/* Price */}
        {options.includePrice && (
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#000',
            textAlign: 'center',
            marginTop: '2px',
            letterSpacing: '0.2px',
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

      {/* Barcode Section */}
      {options.includeBarcode && formattedLabel.barcode && (
        <div style={{
          marginTop: '2px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <canvas 
            ref={canvasRef} 
            style={{
              maxWidth: '200px',
              height: '25px',
              display: 'block'
            }} 
          />
        </div>
      )}
    </div>
  );
}