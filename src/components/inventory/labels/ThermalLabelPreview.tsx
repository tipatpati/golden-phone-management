import React, { useEffect, useState } from "react";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { formatLabelElements } from "./services/labelDataFormatter";
import { BarcodeRenderer } from "./services/BarcodeRenderer";
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
  const [barcodeMarkup, setBarcodeMarkup] = useState<string>('');
  const formattedLabel = formatLabelElements(label, options);

  useEffect(() => {
    if (options.includeBarcode && label.barcode) {
      try {
        // Generate high-quality SVG barcode for crisp preview
        const svgMarkup = BarcodeRenderer.generatePreview(label.barcode);
        setBarcodeMarkup(svgMarkup);
      } catch (error) {
        console.error('Failed to generate barcode:', error);
        setBarcodeMarkup(`
          <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" fill="#ffebee" stroke="#f44336" stroke-width="1"/>
            <text x="100" y="25" text-anchor="middle" font-family="Arial" font-size="10" fill="#d32f2f">
              Barcode Error
            </text>
            <text x="100" y="40" text-anchor="middle" font-family="monospace" font-size="8" fill="#666">
              ${label.barcode}
            </text>
          </svg>
        `);
      }
    } else {
      setBarcodeMarkup('');
    }
  }, [options.includeBarcode, label.barcode]);

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
      {options.includeBarcode && formattedLabel.barcode && barcodeMarkup && (
        <div style={{
          marginTop: '2px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          height: '50px'
        }}>
          <div 
            style={{
              maxWidth: '200px',
              display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: barcodeMarkup }}
          />
        </div>
      )}
    </div>
  );
}