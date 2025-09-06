import { ThermalLabelOptions } from "../types";
import { PRINT_SETTINGS } from "./config";

// Generate robust print styles and enforce landscape orientation
export function generateLabelStyles(options: ThermalLabelOptions): string {
  const { width, height } = PRINT_SETTINGS;

  return `
    @media print {
      @page {
        margin: 10px;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: 10px;
      }

      .thermal-label {
        width: 6cm !important;
        height: 5cm !important;
        margin: 0 !important;
        padding: 3px !important;
        border: none !important;
        background: white !important;
        box-sizing: border-box !important;
        page-break-after: always;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        font-family: Arial, sans-serif !important;
        overflow: hidden !important;
        gap: 1px !important;
      }

      .product-name {
        font-size: 12px !important;
        line-height: 1.0 !important;
        margin-bottom: 1px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
      }

      .barcode-container {
        margin: 0 !important;
        padding: 2px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 55px !important;
      }

      .barcode-canvas {
        height: 50px !important;
        margin: 0 !important;
      }

      .price-section {
        font-size: 24px !important;
        margin: 0 !important;
        padding: 2px 0 !important;
        font-weight: 900 !important;
        border-top: 2px solid #000 !important;
      }

      .label-header {
        min-height: 12px !important;
        margin-bottom: 2mm !important;
        padding-bottom: 1mm !important;
      }

      .main-content {
        flex: 1 !important;
        gap: 1mm !important;
      }

      .color-indicator, .battery-level {
        font-size: 8px !important;
        margin: 1mm 0 !important;
      }

      .thermal-label:last-child {
        page-break-after: avoid;
      }
    }

    .thermal-label {
      width: 227px;  /* 6cm */
      height: 189px; /* 5cm */
      border: 1px solid #ddd;
      padding: 3px;
      background: white;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 10px;
      font-family: Arial, sans-serif;
    }

    .label-header {
      min-height: 20px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 2px;
      margin-bottom: 3px;
      text-align: center;
    }

    .company-header {
      font-size: 7px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 0.9;
      text-align: center;
      margin-bottom: 1px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 1px;
    }

    .product-name {
      font-size: 11px;
      font-weight: 800;
      line-height: 1.0;
      color: #000;
      text-align: center;
      margin-bottom: 1px;
      max-height: 22px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-transform: uppercase;
    }

    .serial-section {
      font-size: 10px;
      font-weight: 600;
      color: #000;
      text-align: center;
      margin-top: 2px;
      letter-spacing: 0.1px;
    }

    .product-specs {
      font-size: 9px;
      font-weight: 700;
      color: #000;
      text-align: center;
      margin-top: 1px;
      margin-bottom: 2px;
      line-height: 1.0;
      background-color: #f8f8f8;
      padding: 1px 3px;
      border-radius: 2px;
      border: 1px solid #ddd;
    }

    .barcode-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0;
      background-color: #ffffff;
      padding: 2px;
      min-height: 55px;
    }

    .barcode-canvas {
      display: block;
      margin: 0 auto 0 auto;
      max-width: 100%;
      height: 50px;
    }

    .barcode-number {
      font-size: 6px;
      font-family: monospace;
      color: #333;
      text-align: center;
      margin: 0;
    }

    .price-section {
      font-size: 24px;
      font-weight: 900;
      color: #000;
      text-align: center;
      margin-top: 0;
      padding: 2px 0;
      letter-spacing: 0.3px;
      border-top: 2px solid #000;
    }


    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
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
      font-size: 14px;
      font-weight: 700;
      color: #000;
      font-family: monospace;
      text-align: center;
      margin: 4px 0;
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
