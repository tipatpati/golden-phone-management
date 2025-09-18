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
        console.log(`🖨️ ThermalLabelPreview: Generating barcode for preview: ${label.barcode}`);
        
        // Phase 3: Use preview-optimized barcode that matches thermal output
        const svgMarkup = BarcodeRenderer.generatePreview(label.barcode);
        setBarcodeMarkup(svgMarkup);
        
        console.log(`✅ ThermalLabelPreview: Barcode generated successfully`);
      } catch (error) {
        console.error('❌ ThermalLabelPreview: Failed to generate barcode:', error);
        setBarcodeMarkup(`
          <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="50" fill="#ffebee" stroke="#f44336" stroke-width="1"/>
            <text x="100" y="20" text-anchor="middle" font-family="Arial" font-size="10" fill="#d32f2f">
              Barcode Error
            </text>
            <text x="100" y="35" text-anchor="middle" font-family="monospace" font-size="8" fill="#666">
              ${label.barcode}
            </text>
          </svg>
        `);
      }
    } else {
      setBarcodeMarkup('');
    }
  }, [options.includeBarcode, label.barcode]);

  // Phase 3: WYSIWYG thermal label styling - exact 6cm × 3cm dimensions
  // Matches UnifiedPrintService exactly for perfect preview consistency
  const labelStyle = {
    width: '227px',   // 6cm at 96 DPI (matches PRINT_SETTINGS)
    height: '113px',  // 3cm at 96 DPI (matches PRINT_SETTINGS)
    border: '2px solid hsl(var(--border))',
    borderRadius: '4px',
    padding: '2px',   // Reduced padding for more space
    margin: '8px',
    fontSize: '7px',  // Smaller base font
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '0.9', // Tighter line height
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'relative' as const
  };
  return (
    <div style={labelStyle}>
      {/* Header Section */}
      {options.includeCompany && formattedLabel.companyName && (
        <div style={{
          fontSize: '6px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: '#000',
          letterSpacing: '0.2px',
          lineHeight: '0.9',
          textAlign: 'center',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '1px',
          marginBottom: '1px'
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
          fontSize: '9px',
          fontWeight: '700',
          lineHeight: '0.9',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.1px',
          textAlign: 'center',
          maxHeight: '18px',
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
            fontSize: '6px',
            fontWeight: '500',
            color: '#555',
            textAlign: 'center',
            lineHeight: '0.9'
          }}>
            {[formattedLabel.storage, formattedLabel.ram, formattedLabel.batteryLevel]
              .filter(Boolean)
              .join(' • ')}
          </div>
        )}
        
        {/* Serial Number */}
        {formattedLabel.serialNumber && (
          <div style={{
            fontSize: '6px',
            fontWeight: '600',
            color: '#000',
            textAlign: 'center',
            letterSpacing: '0.1px',
            lineHeight: '0.9',
            marginTop: '1px'
          }}>
            SN: {formattedLabel.serialNumber}
          </div>
        )}

        {/* Price */}
        {options.includePrice && (
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#000',
            textAlign: 'center',
            marginTop: '1px',
            letterSpacing: '0.1px',
            lineHeight: '0.9'
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

      {/* Phase 3: Barcode Section - matches print service exactly */}
      {options.includeBarcode && formattedLabel.barcode && barcodeMarkup && (
        <div style={{
          height: '35px',           // Reduced height for better fit
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          marginTop: '1px'          // Minimal spacing
        }}>
          <div 
            style={{
              maxWidth: '215px',      // Use more width for barcode
              height: '30px',         // Reduced height
              display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: barcodeMarkup }}
          />
        </div>
      )}
    </div>
  );
}