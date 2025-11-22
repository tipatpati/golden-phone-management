import { ThermalLabelData, ThermalLabelOptions } from "../types";
import { escapeHtml } from "./utils";
// Legacy parsing removed - using label data directly
import { formatLabelElements } from "./labelDataFormatter";

export function generateSingleLabel(
  label: ThermalLabelData,
  options: ThermalLabelOptions & { companyName?: string }
): string {
  const formattedLabel = formatLabelElements(label, options);
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

  // Price section - Show max price if available, otherwise fall back to unit price
  let priceSection = '';
  if (options.includePrice) {
    const displayPrice = label.maxPrice !== undefined && label.maxPrice !== null ? label.maxPrice : label.price;
    if (typeof displayPrice === 'number') {
      priceSection = `
        <div class="price-section">
          €${displayPrice.toFixed(2)}
        </div>
      `;
    }
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
    
    // Use storage data directly from label (no parsing needed)
    if (label.storage) {
      specs.push(`${label.storage}GB`);
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
      </div>

      <!-- Main Content Section -->
      <div class="main-content">
        <!-- Product Name - Primary focus -->
        <div class="product-name">
          ${escapeHtml(formattedLabel.productName)}
        </div>
        
        <!-- Specs and Serial on same row -->
        ${(formattedLabel.storage || formattedLabel.ram || formattedLabel.serialNumber) ? `
          <div class="specs-serial-row">
            ${(formattedLabel.storage || formattedLabel.ram) ? `
              <span class="product-specs">
                ${[formattedLabel.storage, formattedLabel.ram].filter(Boolean).join(' • ')}
              </span>
            ` : ''}
            ${formattedLabel.serialNumber ? `
              <span class="serial-section">
                ${escapeHtml(formattedLabel.serialNumber)}
              </span>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Price Section -->
      ${options.includePrice ? `
        <div class="price-section">
          €${(label.maxPrice !== undefined && label.maxPrice !== null ? label.maxPrice : label.price).toFixed(2)}
        </div>
      ` : ''}

      <!-- Barcode Section -->
      ${options.includeBarcode && label.barcode?.trim() ? `
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${escapeHtml(label.barcode)}"></canvas>
        </div>
      ` : ''}

    </div>
  `;
}
