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
          width: 1.6,
          height: 50,
          displayValue: true,
          fontSize: 11,
          font: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          margin: 6,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }
    }
  }, [label.barcode, options.includeBarcode]);

  // 6cm × 5cm at 96 DPI ≈ 227px × 189px (landscape orientation)
  const labelStyle = {
    width: '227px',
    height: '189px',
    border: '1px solid #ddd',
    padding: '10px',
    margin: '10px',
    fontSize: '9px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '1.2',
    boxSizing: 'border-box' as const,
    overflow: 'hidden'
  };

  return (
    <div style={labelStyle}>
      {/* Company Header */}
      {options.includeCompany && options.companyName && (
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 'bold', 
          textTransform: 'uppercase',
          color: '#666',
          letterSpacing: '0.5px',
          marginBottom: '5px'
        }}>
          {options.companyName}
        </div>
      )}

      {/* Product Name */}
      <div style={{ 
        fontSize: options.format === 'compact' ? '15px' : '17px',
        fontWeight: 'bold',
        lineHeight: '1.2',
        marginBottom: '6px',
        color: '#000'
      }}>
        {label.productName}
      </div>

      {/* Battery Level */}
      {label.batteryLevel && (
        <div style={{ 
          fontSize: '10px', 
          fontWeight: '600', 
          color: '#16a34a',
          marginBottom: '5px'
        }}>
          Battery: {label.batteryLevel}%
        </div>
      )}

      {/* Serial Number */}
      {label.serialNumber && (
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '600', 
          color: '#000',
          marginBottom: '5px'
        }}>
          {label.serialNumber}
        </div>
      )}

      {/* Category */}
      {options.includeCategory && label.category && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666',
          marginBottom: '5px'
        }}>
          {label.category}
        </div>
      )}

      {/* Price */}
      {options.includePrice && (
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#dc2626',
          margin: '8px 0'
        }}>
          €{label.price.toFixed(2)}
        </div>
      )}

      {/* Barcode */}
      {options.includeBarcode && label.barcode && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flex: '1',
          minHeight: '50px',
          marginTop: '6px'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}