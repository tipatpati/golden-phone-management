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
          width: 1.0,
          height: 25,
          displayValue: true,
          fontSize: 6,
          font: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }
    }
  }, [label.barcode, options.includeBarcode]);

  // 6cm × 5cm at 96 DPI ≈ 227px × 189px (landscape)
  const labelStyle = {
    width: '227px',
    height: '189px',
    border: '1px solid #ddd',
    padding: '8px',
    fontSize: '10px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    textAlign: 'left' as const,
    lineHeight: '1.2'
  };

  // Format: Brand Model Color Battery
  const formatProductName = () => {
    let parts = [label.productName];
    if (label.color) parts.push(label.color);
    if (label.batteryLevel) parts.push(`${label.batteryLevel}%`);
    return parts.join(' ');
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
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {options.companyName}
        </div>
      )}

      {/* Main Content - Horizontal Layout */}
      <div style={{
        display: 'flex',
        height: '100%',
        gap: '12px'
      }}>
        {/* Product Info */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Product Name with Color and Battery */}
          <div style={{ 
            fontSize: options.format === 'compact' ? '10px' : '11px',
            fontWeight: 'bold',
            lineHeight: '1.1',
            marginBottom: '4px'
          }}>
            {formatProductName()}
          </div>

          {/* Serial Number */}
          {label.serialNumber && (
            <div style={{ 
              fontSize: '8px', 
              fontWeight: '600', 
              color: '#2563eb',
              marginBottom: '3px'
            }}>
              S/N: {label.serialNumber}
            </div>
          )}

          {/* Category */}
          {options.includeCategory && label.category && (
            <div style={{ 
              fontSize: '7px', 
              color: '#666',
              marginBottom: '3px'
            }}>
              {label.category}
            </div>
          )}

          {/* Price */}
          {options.includePrice && (
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              color: '#dc2626',
              margin: '4px 0'
            }}>
              €{label.price.toFixed(2)}
            </div>
          )}
        </div>

        {/* Barcode */}
        {options.includeBarcode && label.barcode && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '80px',
            height: '100%'
          }}>
            <canvas 
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}