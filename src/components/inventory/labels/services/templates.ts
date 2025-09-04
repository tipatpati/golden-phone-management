import { ThermalLabelData, ThermalLabelOptions } from "../types";
import { escapeHtml } from "./utils";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";

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

  // Product details section - removed serial number elements

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

  // Extract product specifications for the pipe-separated format
  const extractSpecs = () => {
    const specs: string[] = [];
    
    // Add color if available
    if (label.color?.trim()) {
      specs.push(escapeHtml(label.color));
    }
    
    // Extract storage from product name or serial number
    const storageMatch = label.productName.match(/(\d+GB)/);
    if (storageMatch) {
      specs.push(storageMatch[1]);
    } else if (label.serialNumber) {
      const parsed = parseSerialWithBattery(label.serialNumber);
      if (parsed.storage) {
        specs.push(`${parsed.storage}GB`);
      }
    }
    
    // Extract RAM if available (look for pattern like "12GB RAM" or just "12GB" after storage)
    const ramMatch = label.productName.match(/(\d+GB).*?(\d+GB)/);
    if (ramMatch && ramMatch[2] !== ramMatch[1]) {
      specs.push(ramMatch[2]);
    }
    
    // Add warranty period
    specs.push('1 anno');
    
    return specs.join(' | ');
  };

  return `
    <div class="thermal-label">
      <!-- Header Section -->
      <div class="label-header">
        ${options.includeCompany && options.companyName?.trim() ? `
          <div class="company-header">
            ${escapeHtml(options.companyName)}
          </div>
        ` : ''}
        ${options.includeCategory && label.category?.trim() ? `
          <div class="category-label">
            ${escapeHtml(label.category)}
          </div>
        ` : ''}
      </div>

      <!-- Main Content Section -->
      <div class="main-content">
        <!-- Product Name - Primary focus -->
        <div class="product-name">
          ${escapeHtml(label.productName)}
        </div>
      </div>

      <!-- Price Section -->
      ${options.includePrice && typeof label.price === 'number' ? `
        <div class="price-section">
          €${label.price.toFixed(2)}
        </div>
      ` : ''}

      <!-- Barcode Section -->
      ${options.includeBarcode && label.barcode?.trim() ? `
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${escapeHtml(label.barcode)}"></canvas>
        </div>
      ` : ''}

      <!-- Quality Indicator Corner -->
      <div class="quality-indicator"></div>
    </div>
  `;
}
