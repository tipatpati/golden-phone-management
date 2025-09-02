import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ThermalLabelData, ThermalLabelOptions } from "./types";

interface ThermalLabelPreviewProps {
  label: ThermalLabelData;
  options: ThermalLabelOptions & { companyName?: string };
}

export function ThermalLabelPreview({ label, options }: ThermalLabelPreviewProps) {
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
    padding: '8px',
    margin: '8px',
    fontSize: '9px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '1.3',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: 'var(--elevation-2)',
    position: 'relative' as const
  };

  return (
    <div style={labelStyle}>
      {/* Header Section */}
      <div style={{ minHeight: '25px', borderBottom: '1px solid #e5e5e5', paddingBottom: '4px', marginBottom: '6px' }}>
        {options.includeCompany && options.companyName && (
          <div style={{ 
            fontSize: '9px', 
            fontWeight: '700', 
            textTransform: 'uppercase',
            color: 'hsl(var(--primary))',
            letterSpacing: '0.8px',
            lineHeight: '1.1'
          }}>
            {options.companyName}
          </div>
        )}
        {options.includeCategory && label.category && (
          <div style={{ 
            fontSize: '8px', 
            color: 'hsl(var(--muted-foreground))',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            marginTop: '2px'
          }}>
            {label.category}
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
        {/* Product Name - Primary focus */}
        <div style={{ 
          fontSize: options.format === 'compact' ? '14px' : '16px',
          fontWeight: '800',
          lineHeight: '1.1',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          maxHeight: '40px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: options.format === 'compact' ? 2 : 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {label.productName}
        </div>

        {/* Product Details Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '9px',
          marginTop: '2px'
        }}>
          {/* Serial Number */}
          {label.serialNumber && (
            <div style={{ 
              fontSize: '9px', 
              fontWeight: '600', 
              color: '#333',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e9ecef'
            }}>
              SN: {label.serialNumber}
            </div>
          )}

          {/* Battery Level */}
          {label.batteryLevel && label.batteryLevel > 0 && (
            <div style={{ 
              fontSize: '9px', 
              fontWeight: '600', 
              color: label.batteryLevel > 80 ? '#16a34a' : label.batteryLevel > 50 ? '#ca8a04' : '#dc2626',
              backgroundColor: label.batteryLevel > 80 ? '#f0f9ff' : label.batteryLevel > 50 ? '#fefce8' : '#fef2f2',
              padding: '2px 4px',
              borderRadius: '2px',
              border: `1px solid ${label.batteryLevel > 80 ? '#e0f2fe' : label.batteryLevel > 50 ? '#fef3c7' : '#fecaca'}`
            }}>
              🔋 {label.batteryLevel}%
            </div>
          )}
        </div>

        {/* Color indicator if available */}
        {label.color && (
          <div style={{
            fontSize: '8px',
            fontWeight: '600',
            color: '#555',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            padding: '2px 6px',
            borderRadius: '3px',
            margin: '2px auto',
            textTransform: 'capitalize'
          }}>
            Color: {label.color}
          </div>
        )}
      </div>

      {/* Price Section */}
      {options.includePrice && (
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '900', 
          color: 'hsl(var(--primary))',
          textAlign: 'center',
          padding: '6px 0',
          borderTop: '2px solid hsl(var(--primary))',
          borderBottom: '1px solid #e5e5e5',
          marginBottom: '6px',
          backgroundColor: '#f8fafc',
          letterSpacing: '0.5px'
        }}>
          €{label.price.toFixed(2)}
        </div>
      )}

      {/* Barcode Section */}
      {options.includeBarcode && label.barcode && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '45px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '2px',
          padding: '2px'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      )}

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
    </div>
  );
}