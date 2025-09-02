import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";

// Thermal printer settings for 6cm × 5cm labels at 203 DPI (landscape orientation)
export const THERMAL_SETTINGS: ThermalPrintSettings = {
  width: 472,   // 6cm at 203 DPI (landscape width)
  height: 400,  // 5cm at 203 DPI (landscape height)  
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
        
        ${label.batteryLevel ? `
          <div class="battery-level">
            Battery: ${label.batteryLevel}%
          </div>
        ` : ''}
        
        ${label.serialNumber ? `
          <div class="serial-number">
            ${label.serialNumber}
          </div>
        ` : ''}
        
        ${options.includeCategory && label.category ? `
          <div class="category">
            ${label.category}
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
        <title>Thermal Labels - 6cm × 5cm (Landscape)</title>
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
            padding: 10px;
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
            font-size: 11px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          
          .product-name {
            font-size: ${options.format === 'compact' ? '15px' : '17px'};
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 6px;
            color: #000;
          }
          
          .battery-level {
            font-size: 10px;
            font-weight: 600;
            color: #16a34a;
            margin-bottom: 5px;
          }
          
          .serial-number {
            font-size: 11px;
            font-weight: 600;
            color: #000;
            margin-bottom: 5px;
          }
          
          .category {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .price {
            font-size: 18px;
            font-weight: bold;
            color: #dc2626;
            margin: 8px 0;
          }
          
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex: 1;
            min-height: 50px;
            margin-top: 6px;
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