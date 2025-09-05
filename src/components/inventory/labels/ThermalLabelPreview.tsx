import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { formatLabelElements, getBarcodeConfig } from "./services/labelDataFormatter";
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
        // Use consistent barcode format - detect based on content
        let format = 'CODE128';
        if (/^\d{13}$/.test(label.barcode)) {
          format = 'EAN13';
        }
        
        JsBarcode(canvasRef.current, label.barcode, {
          format: format,
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 8,
          font: barcodeConfig.font,
          textAlign: barcodeConfig.textAlign,
          textPosition: barcodeConfig.textPosition,
          textMargin: 4,
          margin: barcodeConfig.margin,
          background: barcodeConfig.background,
          lineColor: barcodeConfig.lineColor
        });
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }
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
        fontSize: '11px',
        fontWeight: '800',
        lineHeight: '1.0',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
        maxHeight: '32px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        hyphens: 'auto',
        textAlign: 'center'
      }}>
          {formattedLabel.productName}
          {(formattedLabel.storage || formattedLabel.ram) && (
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              marginTop: '1px',
              color: '#333'
            }}>
              {formattedLabel.storage}
              {formattedLabel.storage && formattedLabel.ram && ' • '}
              {formattedLabel.ram}
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
      {formattedLabel.price && <div style={{
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
          {formattedLabel.price}
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
          <canvas ref={canvasRef} style={{
        maxWidth: '100%',
        height: '50px'
      }} />
        </div>}

    </div>;
}