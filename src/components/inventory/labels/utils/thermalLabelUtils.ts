import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";

// Thermal printer settings for 5cm × 6cm labels at 203 DPI
export const THERMAL_SETTINGS: ThermalPrintSettings = {
  width: 400,   // 5cm at 203 DPI
  height: 472,  // 6cm at 203 DPI
  dpi: 203,
  margin: 16
};

export function generateThermalLabels(
  labels: ThermalLabelData[],
  options: ThermalLabelOptions & { companyName?: string }
): string {
  const { width, height, margin } = THERMAL_SETTINGS;
  
  const generateLabelContent = (label: ThermalLabelData) => {
    return `
      <div class="thermal-label">
        ${options.includeCompany && options.companyName ? `
          <div class="company-header">
            ${options.companyName}
          </div>
        ` : ''}
        
        <div class="product-name">
          ${label.productName}
        </div>
        
        ${label.serialNumber ? `
          <div class="serial-number">
            S/N: ${label.serialNumber}
          </div>
        ` : ''}
        
        ${options.includeCategory && label.category ? `
          <div class="category">
            ${label.category}
          </div>
        ` : ''}

        ${(label.color || label.batteryLevel) ? `
          <div class="device-info">
            ${label.color ? `Color: ${label.color}` : ''}
            ${label.color && label.batteryLevel ? ' • ' : ''}
            ${label.batteryLevel ? `Battery: ${label.batteryLevel}%` : ''}
          </div>
        ` : ''}
        
        ${options.includePrice ? `
          <div class="price">
            €${label.price.toFixed(2)}
          </div>
        ` : ''}
        
        ${options.includeBarcode ? `
          <div class="barcode-container">
            <canvas class="barcode-canvas" data-barcode="${label.barcode}"></canvas>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Generate all labels with copies
  let allLabels = '';
  labels.forEach(label => {
    for (let i = 0; i < options.copies; i++) {
      allLabels += generateLabelContent(label);
    }
  });

  return `
    <html>
      <head>
        <title>Thermal Labels - 5cm × 6cm</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
        <style>
          @media print {
            @page {
              size: ${width + (margin * 2)}px ${height + (margin * 2)}px;
              margin: ${margin}px;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .thermal-label {
              page-break-after: always;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }
            
            .thermal-label:last-child {
              page-break-after: avoid;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          
          .thermal-label {
            width: ${width}px;
            height: ${height}px;
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
            background: white;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .company-header {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .product-name {
            font-size: ${options.format === 'compact' ? '16px' : '18px'};
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 8px;
            color: #000;
          }
          
          .serial-number {
            font-size: 12px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 6px;
          }
          
          .category {
            font-size: 11px;
            color: #666;
            margin-bottom: 6px;
          }
          
          .device-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
          }
          
          .price {
            font-size: 20px;
            font-weight: bold;
            color: #dc2626;
            margin: 12px 0;
          }
          
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex: 1;
            min-height: 50px;
            margin-top: 8px;
          }
          
          canvas {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${allLabels}
        <script>
          function initializeBarcodes() {
            if (typeof JsBarcode === 'undefined') {
              setTimeout(initializeBarcodes, 500);
              return;
            }
            
            const canvases = document.querySelectorAll('.barcode-canvas');
            
            canvases.forEach(function(canvas) {
              const barcodeValue = canvas.getAttribute('data-barcode');
              if (!barcodeValue) return;
              
              try {
                JsBarcode(canvas, barcodeValue, {
                  format: 'CODE128',
                  width: 1.8,
                  height: 60,
                  displayValue: true,
                  fontSize: 12,
                  font: 'Arial',
                  textAlign: 'center',
                  textPosition: 'bottom',
                  margin: 8,
                  background: '#ffffff',
                  lineColor: '#000000'
                });
              } catch (error) {
                console.error('Barcode generation failed:', error);
              }
            });
          }
          
          window.addEventListener('load', function() {
            initializeBarcodes();
            setTimeout(function() {
              window.print();
            }, 1500);
          });
        </script>
      </body>
    </html>
  `;
}