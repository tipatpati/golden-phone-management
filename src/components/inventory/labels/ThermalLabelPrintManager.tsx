import React, { useRef } from "react";
import { ThermalLabelData, ThermalLabelOptions } from "./types";
import { ThermalLabelPreview } from "./ThermalLabelPreview";
import { supabase } from "@/integrations/supabase/client";

interface ThermalLabelPrintManagerProps {
  labels: ThermalLabelData[];
  options: ThermalLabelOptions & { companyName?: string };
}

export function ThermalLabelPrintManager({ labels, options }: ThermalLabelPrintManagerProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const captureLabelsHTML = (): string => {
    if (!previewContainerRef.current) {
      throw new Error('Label previews not found');
    }

    // Generate all labels HTML exactly as they appear in preview
    const labelsHTML = labels.flatMap(label => 
      Array(options.copies).fill(null).map(() => {
        // Create a temporary container to render each label
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          width: 227px;
          height: 189px;
          border: 2px solid #000;
          border-radius: 4px;
          padding: 3px;
          margin: 8px;
          font-size: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: white;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          text-align: center;
          line-height: 1.1;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
          gap: 1px;
          page-break-inside: avoid;
        `;
        
        // This would need to be the rendered HTML from ThermalLabelPreview
        // For now, we'll create a simplified version that matches the preview
        tempDiv.innerHTML = generateLabelHTML(label, options);
        return tempDiv.outerHTML;
      })
    ).join('\n');

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Thermal Labels</title>
          <style>
            @page { 
              margin: 0; 
              size: auto;
            }
            body { 
              margin: 0; 
              padding: 8px; 
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .label-container {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .label {
              width: 227px;
              height: 189px;
              border: 2px solid #000;
              border-radius: 4px;
              padding: 3px;
              font-size: 8px;
              background: white;
              display: flex;
              flex-direction: column;
              text-align: center;
              line-height: 1.1;
              box-sizing: border-box;
              overflow: hidden;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${labelsHTML}
          </div>
        </body>
      </html>
    `;

    return fullHTML;
  };

  const generateLabelHTML = (label: ThermalLabelData, options: ThermalLabelOptions & { companyName?: string }): string => {
    // This should match exactly what ThermalLabelPreview renders
    return `
      <div style="min-height: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 1px; margin-bottom: 2px;">
        ${options.companyName ? `<div style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${options.companyName}</div>` : ''}
      </div>
      
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px;">
        <div style="font-size: 16px; font-weight: 800; line-height: 1.0; color: #000; text-transform: uppercase;">
          ${label.productName}
          ${label.storage || label.ram ? `
            <div style="font-size: 14px; font-weight: 600; margin-top: 1px; color: #333;">
              ${label.storage || ''}${label.storage && label.ram ? ' • ' : ''}${label.ram || ''}
            </div>
          ` : ''}
        </div>
        
        ${label.serialNumber ? `
          <div style="font-size: 10px; font-weight: 600; color: #000; margin-top: 2px;">
            ${label.serialNumber}
          </div>
        ` : ''}
      </div>
      
      ${label.maxPrice ? `
        <div style="font-size: 24px; font-weight: 900; color: #000; padding: 2px 0; border-top: 2px solid #000; margin-bottom: 2px;">
          €${label.maxPrice.toFixed(2)}
        </div>
      ` : ''}
      
      ${label.barcode ? `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 55px; background: #fff; padding: 2px;">
          <div style="font-size: 10px; font-family: monospace; letter-spacing: 1px;">${label.barcode}</div>
        </div>
      ` : ''}
    `;
  };

  const handlePrint = async () => {
    // This component is now mainly for preview rendering
    // The actual printing is handled by the exported function
    return printThermalLabels(labels, options);
  };

  return (
    <div>
      {/* Hidden container that renders all labels for capture */}
      <div ref={previewContainerRef} style={{ display: 'none' }}>
        {labels.map((label, index) => (
          <ThermalLabelPreview key={index} label={label} options={options} />
        ))}
      </div>
    </div>
  );
}

// Export the print function for external use
export const printThermalLabels = async (
  labels: ThermalLabelData[], 
  options: ThermalLabelOptions & { companyName?: string }
): Promise<{ success: boolean; message: string; totalLabels: number }> => {
  try {
    const totalLabels = labels.length * options.copies;

    // Generate the exact same HTML structure as the preview components
    const labelsHTML = labels.flatMap(label => 
      Array(options.copies).fill(null).map(() => generateLabelHTML(label, options))
    ).join('\n');

    const completeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Thermal Labels</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 8px; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            .label-container { display: flex; flex-wrap: wrap; gap: 8px; }
            .thermal-label {
              width: 227px; height: 189px; border: 2px solid #000; border-radius: 4px;
              padding: 3px; margin: 8px; font-size: 8px; background: white;
              display: flex; flex-direction: column; text-align: center; line-height: 1.1;
              box-sizing: border-box; overflow: hidden; page-break-inside: avoid; gap: 1px;
            }
          </style>
        </head>
        <body>
          <div class="label-container">${labelsHTML}</div>
        </body>
      </html>
    `;

    // Use direct printing (most reliable for thermal labels)
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Print popup blocked. Please allow popups.');
    }

    printWindow.document.write(completeHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 1000);

    return {
      success: true,
      message: `Successfully prepared ${totalLabels} thermal labels for printing`,
      totalLabels
    };

  } catch (error) {
    console.error('Print failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Print failed',
      totalLabels: 0 
    };
  }
};

// Helper function that matches the preview exactly
const generateLabelHTML = (label: ThermalLabelData, options: ThermalLabelOptions & { companyName?: string }): string => {
  return `
    <div class="thermal-label">
      <div style="min-height: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 1px; margin-bottom: 2px;">
        ${options.companyName ? `<div style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${options.companyName}</div>` : ''}
      </div>
      
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px;">
        <div style="font-size: 16px; font-weight: 800; line-height: 1.0; color: #000; text-transform: uppercase;">
          ${label.productName}
          ${label.storage || label.ram ? `
            <div style="font-size: 14px; font-weight: 600; margin-top: 1px; color: #333;">
              ${label.storage || ''}${label.storage && label.ram ? ' • ' : ''}${label.ram || ''}
            </div>
          ` : ''}
        </div>
        
        ${label.serialNumber ? `
          <div style="font-size: 10px; font-weight: 600; color: #000; margin-top: 2px;">
            ${label.serialNumber}
          </div>
        ` : ''}
      </div>
      
      ${label.maxPrice ? `
        <div style="font-size: 24px; font-weight: 900; color: #000; padding: 2px 0; border-top: 2px solid #000; margin-bottom: 2px;">
          €${label.maxPrice.toFixed(2)}
        </div>
      ` : ''}
      
      ${label.barcode ? `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 55px; background: #fff; padding: 2px;">
          <div style="font-size: 10px; font-family: monospace; letter-spacing: 1px;">${label.barcode}</div>
        </div>
      ` : ''}
    </div>
  `;
};