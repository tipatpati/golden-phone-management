import React, { useEffect, useState } from "react";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { formatLabelElements } from "./services/labelDataFormatter";
import { BarcodeRenderer } from "./services/BarcodeRenderer";
import { PRINT_SETTINGS } from "./services/config";
import { logger } from "@/utils/logger";

interface ThermalLabelPreviewProps {
  label: ThermalLabelData;
  options: ThermalLabelOptions & {
    companyName?: string;
    isSupplierLabel?: boolean;
  };
}

export function ThermalLabelPreview({ label, options }: ThermalLabelPreviewProps) {
  const [barcodeMarkup, setBarcodeMarkup] = useState<string>("");

  // Format the label for display
  const formattedLabel = formatLabelElements(label, options);

  // Generate barcode when it changes
  useEffect(() => {
    if (!options.includeBarcode || !label.barcode) {
      setBarcodeMarkup("");
      return;
    }

    try {
      const markup = BarcodeRenderer.generatePreview(label.barcode);
      setBarcodeMarkup(markup);
    } catch (error) {
      logger.error('Failed to generate barcode preview', { 
        error, 
        barcode: label.barcode 
      });
      setBarcodeMarkup(`
        <svg width="200" height="100">
          <text x="100" y="50" text-anchor="middle" fill="red">Error</text>
        </svg>
      `);
    }
  }, [options.includeBarcode, label.barcode]);

  // Label styling
  const labelStyle = {
    width: `${PRINT_SETTINGS.width}px`,
    height: `${PRINT_SETTINGS.height}px`,
    border: '1px solid hsl(var(--border))',
    borderRadius: '2px',
    padding: '1px',
    margin: '4px',
    fontSize: '5px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    textAlign: 'center' as const,
    lineHeight: '0.85',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    position: 'relative' as const
  };

  return (
    <div style={labelStyle}>
      {/* Header Section */}
      {options.includeCompany && formattedLabel.companyName && (
        <div style={{
          fontSize: '4.5px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: '#000',
          letterSpacing: '0.1px',
          lineHeight: '0.85',
          textAlign: 'center',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '0.5px',
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
        gap: '1px'
      }}>
        {/* Product Name */}
        <div style={{
          fontSize: '6px',
          fontWeight: '700',
          lineHeight: '0.85',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.05px',
          textAlign: 'center',
          maxHeight: '16px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}>
          {formattedLabel.productName}
        </div>
        
        {/* Specifications */}
        {(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) && (
          <div style={{
            fontSize: '5px',
            fontWeight: '500',
            color: '#555',
            textAlign: 'center',
            lineHeight: '0.85'
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
            fontWeight: '700',
            color: '#000',
            textAlign: 'center',
            letterSpacing: '0.05px',
            lineHeight: '0.85',
            marginTop: '1px'
          }}>
            SN: {formattedLabel.serialNumber}
          </div>
        )}

        {/* Price */}
        {options.includePrice && formattedLabel.price && (
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#000',
            textAlign: 'center',
            marginTop: '1.5px',
            letterSpacing: '0.05px',
            lineHeight: '0.85'
          }}>
            {formattedLabel.price}
          </div>
        )}
      </div>

      {/* Barcode Section */}
      {options.includeBarcode && formattedLabel.barcode && barcodeMarkup && (
        <div style={{
          height: '25px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          marginTop: '0.5px'
        }}>
          <div 
            style={{
              maxWidth: `${PRINT_SETTINGS.width - 12}px`,
              height: '22px',
              display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: barcodeMarkup }}
          />
        </div>
      )}
    </div>
  );
}
