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
          width: 1.2,
          height: 30,
          displayValue: true,
          fontSize: 8,
          font: 'Arial',
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

  // 5cm × 6cm at 96 DPI ≈ 189px × 227px
  const labelStyle = {
    width: '189px',
    height: '227px',
    border: '1px solid #ddd',
    padding: '8px',
    fontSize: '10px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '1.2'
  };

  return (
    <div style={labelStyle}>
      {/* Company Header */}
      {options.includeCompany && options.companyName && (
        <div style={{ 
          fontSize: '8px', 
          fontWeight: 'bold', 
          textTransform: 'uppercase',
          color: '#666',
          marginBottom: '4px'
        }}>
          {options.companyName}
        </div>
      )}

      {/* Product Name */}
      <div style={{ 
        fontSize: options.format === 'compact' ? '11px' : '12px',
        fontWeight: 'bold',
        lineHeight: '1.1',
        marginBottom: '4px'
      }}>
        {label.productName}
      </div>

      {/* Serial Number */}
      {label.serialNumber && (
        <div style={{ 
          fontSize: '9px', 
          fontWeight: '600', 
          color: '#2563eb',
          marginBottom: '4px'
        }}>
          S/N: {label.serialNumber}
        </div>
      )}

      {/* Category */}
      {options.includeCategory && label.category && (
        <div style={{ 
          fontSize: '8px', 
          color: '#666',
          marginBottom: '4px'
        }}>
          {label.category}
        </div>
      )}

      {/* Color/Battery Info */}
      {(label.color || label.batteryLevel) && (
        <div style={{ fontSize: '8px', color: '#666', marginBottom: '4px' }}>
          {label.color && <span>Color: {label.color}</span>}
          {label.color && label.batteryLevel && <span> • </span>}
          {label.batteryLevel && <span>Battery: {label.batteryLevel}%</span>}
        </div>
      )}

      {/* Price */}
      {options.includePrice && (
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#dc2626',
          margin: '6px 0'
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
          minHeight: '40px'
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