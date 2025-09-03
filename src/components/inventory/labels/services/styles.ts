import { ThermalLabelOptions } from "../types";
import { PRINT_SETTINGS } from "./config";

// Generate robust print styles and enforce landscape orientation
export function generateLabelStyles(options: ThermalLabelOptions): string {
  const { width, height } = PRINT_SETTINGS;

  return `
    @media print {
      @page {
        size: 6cm 5cm;
        margin: 0;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }

      .thermal-label {
        width: 6cm !important;
        height: 5cm !important;
        margin: 0 !important;
        padding: 2mm !important;
        border: none !important;
        background: white !important;
        box-sizing: border-box !important;
        page-break-after: always;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        font-family: Arial, sans-serif !important;
      }

      .barcode-container {
        margin: 1mm 0 !important;
        padding: 1mm !important;
      }

      .price-section {
        margin-top: 1mm !important;
        padding-top: 1mm !important;
        font-size: 18px !important;
      }

      .thermal-label:last-child {
        page-break-after: avoid;
      }
    }

    .thermal-label {
      width: ${width}px;
      height: ${height}px;
      border: 1px solid #ddd;
      padding: 4px;
      background: white;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 10px;
      font-family: Arial, sans-serif;
    }

    .label-header {
      min-height: 25px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-align: center;
    }

    .company-header {
      font-size: 10px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      line-height: 1.1;
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 4px;
    }

    .product-name {
      font-size: ${options.format === 'compact' ? '16px' : '18px'};
      font-weight: 800;
      line-height: 1.1;
      color: #000;
      text-align: center;
      margin-bottom: 6px;
      max-height: 40px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-specs {
      font-size: 11px;
      font-weight: 500;
      color: #333;
      text-align: center;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .barcode-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 2px 0;
      background-color: #ffffff;
      padding: 2px;
    }

    .barcode-canvas {
      display: block;
      margin: 0 auto 2px auto;
      max-width: 100%;
      height: auto;
    }

    .barcode-number {
      font-size: 7px;
      font-family: monospace;
      color: #333;
      text-align: center;
      margin: 0;
    }

    .price-section {
      font-size: 20px;
      font-weight: 900;
      color: #000;
      text-align: center;
      margin-top: 2px;
      padding-top: 2px;
      letter-spacing: 0.5px;
    }

    /* Remove unused styles - keeping only relevant ones */
    .category-label {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 2px;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
    }

    .product-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      margin-top: 2px;
      gap: 4px;
    }

    .serial-number {
      font-size: 9px;
      font-weight: 600;
      color: #333;
      font-family: monospace;
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 2px;
      border: 1px solid #e9ecef;
      white-space: nowrap;
    }

    .battery-level {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 4px;
      border-radius: 2px;
      border: 1px solid;
      white-space: nowrap;
    }

    .battery-high {
      color: #16a34a;
      background-color: #f0f9ff;
      border-color: #e0f2fe;
    }

    .battery-medium {
      color: #ca8a04;
      background-color: #fefce8;
      border-color: #fef3c7;
    }

    .battery-low {
      color: #dc2626;
      background-color: #fef2f2;
      border-color: #fecaca;
    }

    .color-indicator {
      font-size: 8px;
      font-weight: 600;
      color: #555;
      text-align: center;
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      margin: 2px auto;
      text-transform: capitalize;
    }
  `;
}
