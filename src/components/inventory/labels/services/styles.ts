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
        height: 3cm !important;
        margin: 0 !important;
        padding: 4px !important;
        border: none !important;
        background: white !important;
        box-sizing: border-box !important;
        page-break-after: always;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        font-family: Arial, sans-serif !important;
        overflow: hidden !important;
      }

      .company-header {
        font-size: 7px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        color: #000 !important;
        letter-spacing: 0.3px !important;
        line-height: 1.0 !important;
        text-align: center !important;
        border-bottom: 1px solid #e5e5e5 !important;
        padding-bottom: 2px !important;
        margin-bottom: 2px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      .label-content {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        gap: 2px !important;
      }

      .product-name {
        font-size: 13px !important;
        line-height: 1.0 !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.2px !important;
        color: #000 !important;
        text-align: center !important;
        max-height: 20px !important;
        overflow: hidden !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        word-break: break-word !important;
        hyphens: auto !important;
      }

      .product-specs {
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #555 !important;
        text-align: center !important;
        line-height: 1.0 !important;
      }

      .serial-section {
        font-size: 7px !important;
        font-weight: 600 !important;
        color: #000 !important;
        text-align: center !important;
        letter-spacing: 0.1px !important;
        line-height: 1.0 !important;
        margin-top: 1px !important;
      }

      .price-section {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #000 !important;
        text-align: center !important;
        margin-top: 2px !important;
        letter-spacing: 0.2px !important;
        line-height: 1.0 !important;
      }

      .barcode-container {
        margin-top: 2px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        background-color: #ffffff !important;
      }

      .barcode-canvas {
        max-width: 200px !important;
        height: 50px !important;
        display: block !important;
        margin: 0 !important;
      }

      .price-section {
        font-size: 32px !important;
        margin: 0 !important;
        padding: 2px 0 !important;
        font-weight: 900 !important;
        border-top: 2px solid #000 !important;
        margin-bottom: 2px !important;
        letter-spacing: 0.3px !important;
        line-height: 1.0 !important;
        text-align: center !important;
      }

      .label-header {
        min-height: 16px !important;
        border-bottom: 1px solid #e5e5e5 !important;
        padding-bottom: 1px !important;
        margin-bottom: 2px !important;
        overflow: hidden !important;
      }

      .main-content {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        gap: 2px !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .thermal-label:last-child {
        page-break-after: avoid;
      }
    }

    .thermal-label {
      width: 227px;  /* 6cm */
      height: 113px; /* 3cm */
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
      min-height: 16px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 1px;
      margin-bottom: 2px;
      text-align: center;
      overflow: hidden;
    }

    .company-header {
      font-size: 8px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.0;
      text-align: center;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-name {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.0;
      color: #000;
      text-align: center;
      margin-bottom: 1px;
      max-height: 30px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      word-break: break-word;
      hyphens: auto;
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
      font-size: 18px;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-top: 1px;
      margin-bottom: 2px;
      line-height: 1.0;
    }

    .barcode-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      background-color: #ffffff;
      padding: 2px;
      min-height: 55px;
      max-height: 55px;
      overflow: hidden;
    }

    .barcode-canvas {
      display: block;
      margin: 0 auto;
      max-width: 200px;
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
      font-size: 32px;
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
