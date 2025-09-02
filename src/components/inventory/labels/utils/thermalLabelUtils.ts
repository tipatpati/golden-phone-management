import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";

// Thermal printer settings for 6cm × 5cm labels at 203 DPI (landscape)
export const THERMAL_SETTINGS: ThermalPrintSettings = {
  width: 472,   // 6cm at 203 DPI (landscape)
  height: 400,  // 5cm at 203 DPI (landscape)
  dpi: 203,
  margin: 16
};

export function generateThermalLabels(
  labels: ThermalLabelData[],
  options: ThermalLabelOptions & { companyName?: string }
): string {
  const { width, height, margin } = THERMAL_SETTINGS;
  
  const generateLabelContent = (label: ThermalLabelData) => {
    // Format: Brand Model Color Battery
    const formatProductName = () => {
      let parts = [label.productName];
      if (label.color) parts.push(label.color);
      if (label.batteryLevel) parts.push(`${label.batteryLevel}%`);
      return parts.join(' ');
    };

    return `
      <div class="thermal-label">
        ${options.includeCompany && options.companyName ? `
          <div class="company-header">
            ${options.companyName}
          </div>
        ` : ''}
        
        <div class="main-content">
          <div class="product-info">
            <div class="product-name">
              ${formatProductName()}
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

            ${options.includePrice ? `
              <div class="price">
                €${label.price.toFixed(2)}
              </div>
            ` : ''}
          </div>
          
          ${options.includeBarcode ? `
            <div class="barcode-container">
              <canvas class="barcode-canvas" data-barcode="${label.barcode}"></canvas>
            </div>
          ` : ''}
        </div>
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
            padding: 8px;
            text-align: left;
            background: white;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .company-header {
            font-size: 10px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            text-align: center;
          }
          
          .main-content {
            display: flex;
            height: 100%;
            gap: 12px;
          }
          
          .product-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .product-name {
            font-size: ${options.format === 'compact' ? '14px' : '16px'};
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 6px;
            color: #000;
          }
          
          .serial-number {
            font-size: 11px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 4px;
          }
          
          .category {
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
          }
          
          .price {
            font-size: 18px;
            font-weight: bold;
            color: #dc2626;
            margin: 6px 0;
          }
          
          .barcode-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 140px;
            height: 100%;
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
                    width: 1.4,
                    height: 50,
                    displayValue: true,
                    fontSize: 10,
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