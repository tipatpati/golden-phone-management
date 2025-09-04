import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
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
          width: 1.8,
          height: 55,
          displayValue: true,
          fontSize: 10,
          font: 'Arial, sans-serif',
          textAlign: 'center',
          textPosition: 'bottom',
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }
    }
  }, [label.barcode, options.includeBarcode]);

  // Professional thermal label styling - 6cm × 5cm landscape
  const labelStyle = {
    width: '227px',
    height: '189px',
    border: '2px solid hsl(var(--border))',
    borderRadius: '4px',
    padding: '4px',
    margin: '8px',
    fontSize: '9px',
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
        {options.includeCompany && options.companyName && <div style={{
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
            {options.companyName}
          </div>}
        {options.includeCategory && label.category && <div style={{
        fontSize: '7px',
        color: 'hsl(var(--muted-foreground))',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
        marginTop: '1px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
            {label.category}
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
        {/* Product Name - Primary focus */}
        <div style={{
        fontSize: options.format === 'compact' ? '16px' : '18px',
        fontWeight: '800',
        lineHeight: '1.0',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
        maxHeight: '36px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        hyphens: 'auto'
      }}>
          {label.productName}
        </div>

        {/* Color indicator if available */}
        {label.color && <div style={{
        fontSize: '10px',
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        padding: '2px 6px',
        borderRadius: '3px',
        margin: '1px auto',
        textTransform: 'capitalize'
      }}>
          {label.color}
        </div>}
      </div>

      {/* Price Section */}
      {options.includePrice && <div style={{
      fontSize: '20px',
      fontWeight: '900',
      color: 'hsl(var(--primary))',
      textAlign: 'center',
      padding: '2px 0',
      borderTop: '2px solid hsl(var(--primary))',
      borderBottom: '1px solid #e5e5e5',
      marginBottom: '2px',
      backgroundColor: '#f8fafc',
      letterSpacing: '0.3px',
      lineHeight: '1.0'
    }}>
          €{label.price.toFixed(2)}
        </div>}

      {/* Barcode Section */}
      {options.includeBarcode && label.barcode && <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '45px',
      maxHeight: '45px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e5e5',
      borderRadius: '2px',
      padding: '1px',
      overflow: 'hidden'
    }}>
          <canvas ref={canvasRef} style={{
        maxWidth: '100%',
        maxHeight: '100%',
        height: 'auto'
      }} />
        </div>}

      {/* Quality Indicator Corner */}
      <div style={{
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '8px',
      height: '8px',
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: '50%',
      opacity: 0.7
    }} />
    </div>;
}