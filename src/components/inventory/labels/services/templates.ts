import { ThermalLabelData, ThermalLabelOptions } from "../types";
import { escapeHtml } from "./utils";

export function generateSingleLabel(
  label: ThermalLabelData,
  options: ThermalLabelOptions & { companyName?: string }
): string {
  // Header section with company and category
  const headerElements: string[] = [];
  if (options.includeCompany && options.companyName?.trim()) {
    headerElements.push(`
      <div class="company-header">
        ${escapeHtml(options.companyName)}
      </div>
    `);
  }
  if (options.includeCategory && label.category?.trim()) {
    headerElements.push(`
      <div class="category-label">
        ${escapeHtml(label.category)}
      </div>
    `);
  }

  // Product details section
  const detailsElements: string[] = [];
  if (label.serialNumber?.trim()) {
    detailsElements.push(`
      <div class="serial-number">
        SN: ${escapeHtml(label.serialNumber)}
      </div>
    `);
  }

  if (label.batteryLevel && label.batteryLevel > 0) {
    const batteryClass = label.batteryLevel > 80 ? 'battery-high' :
                        label.batteryLevel > 50 ? 'battery-medium' : 'battery-low';
    detailsElements.push(`
      <div class="battery-level ${batteryClass}">
        🔋 ${label.batteryLevel}%
      </div>
    `);
  }

  // Color indicator
  let colorIndicator = '';
  if (label.color?.trim()) {
    colorIndicator = `
      <div class="color-indicator">
        Color: ${escapeHtml(label.color)}
      </div>
    `;
  }

  // Price section
  let priceSection = '';
  if (options.includePrice && typeof label.price === 'number') {
    priceSection = `
      <div class="price-section">
        €${label.price.toFixed(2)}
      </div>
    `;
  }

  // Barcode section
  let barcodeSection = '';
  if (options.includeBarcode && label.barcode?.trim()) {
    barcodeSection = `
      <div class="barcode-container">
        <canvas class="barcode-canvas" data-barcode="${escapeHtml(label.barcode)}"></canvas>
      </div>
    `;
  }

  return `
    <div class="thermal-label">
      <!-- Header Section -->
      <div class="label-header">
        ${headerElements.join('')}
      </div>

      <!-- Main Content Section -->
      <div class="main-content">
        <div class="product-name">
          ${escapeHtml(label.productName)}
        </div>
        
        <div class="product-details">
          ${detailsElements.join('')}
        </div>
        
        ${colorIndicator}
      </div>

      <!-- Price Section -->
      ${priceSection}

      <!-- Barcode Section -->
      ${barcodeSection}

      <!-- Quality Indicator -->
      <div class="quality-indicator"></div>
    </div>
  `;
}
