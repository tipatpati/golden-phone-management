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
        JsBarcode(canvasRef.current, label.barcode, {
          format: 'CODE128',
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
    padding: '6px',
    margin: '8px',
    fontSize: '9px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    textAlign: 'center' as const,
    lineHeight: '1.2',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: 'var(--elevation-2)',
    position: 'relative' as const,
    gap: '2px'
  };
  return <div style={labelStyle}>
      {/* Header Section */}
      <div style={{
      minHeight: '20px',
      borderBottom: '1px solid #e5e5e5',
      paddingBottom: '2px',
      marginBottom: '3px',
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
        fontSize: options.format === 'compact' ? '12px' : '14px',
        fontWeight: '800',
        lineHeight: '1.0',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
        maxHeight: '28px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        hyphens: 'auto'
      }}>
          {label.productName}
        </div>

        {/* Product Details Row */}
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '8px',
        gap: '2px',
        flexWrap: 'wrap',
        maxHeight: '20px',
        overflow: 'hidden'
      }}>
          {/* Serial Number */}
          {label.serialNumber}

          {/* Battery Level */}
          {label.batteryLevel && label.batteryLevel > 0 && <div style={{
          fontSize: '7px',
          fontWeight: '600',
          color: label.batteryLevel > 80 ? '#16a34a' : label.batteryLevel > 50 ? '#ca8a04' : '#dc2626',
          backgroundColor: label.batteryLevel > 80 ? '#f0f9ff' : label.batteryLevel > 50 ? '#fefce8' : '#fef2f2',
          padding: '1px 3px',
          borderRadius: '2px',
          border: `1px solid ${label.batteryLevel > 80 ? '#e0f2fe' : label.batteryLevel > 50 ? '#fef3c7' : '#fecaca'}`,
          whiteSpace: 'nowrap'
        }}>
              🔋 {label.batteryLevel}%
            </div>}
        </div>

        {/* Color indicator if available */}
        {label.color && <div style={{
        fontSize: '7px',
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        padding: '1px 4px',
        borderRadius: '2px',
        margin: '1px auto',
        textTransform: 'capitalize',
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
            Color: {label.color}
          </div>}
      </div>

      {/* Price Section */}
      {options.includePrice && <div style={{
      fontSize: '16px',
      fontWeight: '900',
      color: 'hsl(var(--primary))',
      textAlign: 'center',
      padding: '3px 0',
      borderTop: '2px solid hsl(var(--primary))',
      borderBottom: '1px solid #e5e5e5',
      marginBottom: '3px',
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
      minHeight: '35px',
      maxHeight: '35px',
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