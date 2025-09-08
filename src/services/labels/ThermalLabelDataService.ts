import { ProductUnitsService } from "@/services/inventory/ProductUnitsService";
import type { ProductUnit } from "@/services/inventory/types";
import { formatProductName, formatProductUnitName } from "@/utils/productNaming";
import { LabelDataValidator } from "./LabelDataValidator";
import { ProductForLabels, ThermalLabelData, LabelDataResult } from "./types";

export class ThermalLabelDataService {
  /**
   * Centralized service to fetch and prepare thermal label data
   * This is the single source of truth for all label generation
   */
  static async generateLabelsForProducts(
    products: ProductForLabels[],
    options?: { useMasterBarcode?: boolean }
  ): Promise<LabelDataResult> {
    console.log('🏷️ ThermalLabelDataService: Starting label generation for', products.length, 'products');
    
    const labels: ThermalLabelData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let unitsWithBarcodes = 0;
    let unitsMissingBarcodes = 0;
    let genericLabels = 0;

    for (const product of products) {
      console.log(`\n🔍 Processing product: ${product.id} (${product.brand} ${product.model})`);
      
      // Validate product first
      const productValidation = LabelDataValidator.validateProduct(product);
      if (!productValidation.isValid) {
        errors.push(...productValidation.errors);
        console.error('❌ Product validation failed:', productValidation.errors);
        continue;
      }
      warnings.push(...productValidation.warnings);

      // Clean brand and model names
      const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();

      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Product has serial numbers - fetch and process units
        const productLabels = await this.processProductWithUnits(
          product, 
          cleanBrand, 
          cleanModel
        );
        
        labels.push(...productLabels.labels);
        errors.push(...productLabels.errors);
        warnings.push(...productLabels.warnings);
        unitsWithBarcodes += productLabels.stats.unitsWithBarcodes;
        unitsMissingBarcodes += productLabels.stats.unitsMissingBarcodes;
        
      } else {
        // Product without serial numbers - generate generic labels
        const productLabels = this.processProductWithoutUnits(
          product, 
          cleanBrand, 
          cleanModel
        );
        
        labels.push(...productLabels.labels);
        genericLabels += productLabels.labels.length;
      }
    }

    const result: LabelDataResult = {
      success: errors.length === 0,
      labels,
      errors,
      warnings,
      stats: {
        totalProducts: products.length,
        totalLabels: labels.length,
        unitsWithBarcodes,
        unitsMissingBarcodes,
        genericLabels
      }
    };

    console.log('✅ ThermalLabelDataService: Generation complete', result.stats);
    
    if (errors.length > 0) {
      console.error('❌ ThermalLabelDataService: Errors encountered:', errors);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ ThermalLabelDataService: Warnings:', warnings);
    }

    return result;
  }

  /**
   * Process a product that has individual units with serial numbers
   */
  private static async processProductWithUnits(
    product: ProductForLabels,
    cleanBrand: string,
    cleanModel: string
  ): Promise<LabelDataResult> {
    const labels: ThermalLabelData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let unitsWithBarcodes = 0;
    let unitsMissingBarcodes = 0;

    try {
      // Fetch units for the product
      console.log(`📦 Fetching units for product ${product.id}...`);
      const units = await ProductUnitsService.getUnitsForProduct(product.id);
      console.log(`✅ Found ${units.length} units`);

      // Process each unit
      for (const unit of units) {
        if (unit.barcode) {
          const label = this.createUnitLabel(unit, product, cleanBrand, cleanModel);
          if (label) {
            labels.push(label);
            unitsWithBarcodes++;
            console.log(`✅ Label created: ${unit.serial_number} → ${unit.barcode}`);
          }
        } else {
          unitsMissingBarcodes++;
          warnings.push(`Unit ${unit.serial_number} missing barcode - use "Fix Missing Barcodes" button`);
          console.warn(`⚠️ Unit ${unit.serial_number} has no barcode`);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to process units for product ${product.id}: ${error}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);
    }

    return {
      success: errors.length === 0,
      labels,
      errors,
      warnings,
      stats: {
        totalProducts: 1,
        totalLabels: labels.length,
        unitsWithBarcodes,
        unitsMissingBarcodes,
        genericLabels: 0
      }
    };
  }

  /**
   * Process a product without individual units (bulk inventory)
   */
  private static processProductWithoutUnits(
    product: ProductForLabels,
    cleanBrand: string,
    cleanModel: string
  ): LabelDataResult {
    console.log(`📦 Processing bulk product: ${product.id}`);
    
    const labels: ThermalLabelData[] = [];
    const quantity = Math.max(1, Math.min(product.stock || 1, 10));
    const productName = formatProductName({ 
      brand: cleanBrand, 
      model: cleanModel 
    });

    // Only create labels if product has existing barcode - no generation
    if (!product.barcode) {
      console.warn(`⚠️ Bulk product ${product.id} has no barcode - cannot create labels`);
      return {
        success: false,
        labels: [],
        errors: [`Product ${cleanBrand} ${cleanModel} has no barcode`],
        warnings: [],
        stats: {
          totalProducts: 1,
          totalLabels: 0,
          unitsWithBarcodes: 0,
          unitsMissingBarcodes: 0,
          genericLabels: 0
        }
      };
    }

    for (let i = 0; i < quantity; i++) {
      const label: ThermalLabelData = {
        productName,
        barcode: product.barcode, // ONLY use existing product barcode
        price: product.max_price ?? product.price ?? 0,
        category: product.category?.name,
        storage: product.storage || 128,
        ram: product.ram || 6,
        batteryLevel: undefined // Generic labels don't have specific battery info
      };
      
      labels.push(label);
      console.log(`✅ Created generic label ${i + 1}/${quantity} using existing barcode`);
    }

    return {
      success: true,
      labels,
      errors: [],
      warnings: [],
      stats: {
        totalProducts: 1,
        totalLabels: labels.length,
        unitsWithBarcodes: 0,
        unitsMissingBarcodes: 0,
        genericLabels: labels.length
      }
    };
  }

  /**
   * Create a thermal label from a product unit
   */
  private static createUnitLabel(
    unit: ProductUnit,
    product: ProductForLabels,
    cleanBrand: string,
    cleanModel: string
  ): ThermalLabelData | null {
    // Unit must have a barcode (validated earlier)
    if (!unit.barcode) {
      console.error(`❌ Unit ${unit.serial_number} has no barcode - should not reach this point`);
      return null;
    }

    // Resolve storage and RAM with proper fallbacks
    const storage = unit.storage ?? product.storage ?? 128;
    const ram = unit.ram ?? product.ram ?? 6;

    // Generate formatted product name
    const productName = formatProductUnitName({
      brand: cleanBrand,
      model: cleanModel,
      storage,
      color: unit.color
    });

    // Resolve pricing with hierarchy: unit price > product price > 0
    const price = unit.price ?? product.price ?? 0;
    const maxPrice = unit.max_price ?? product.max_price ?? null;

    const label: ThermalLabelData = {
      productName,
      serialNumber: unit.serial_number,
      barcode: unit.barcode,
      price,
      maxPrice,
      category: product.category?.name,
      color: unit.color,
      batteryLevel: unit.battery_level,
      storage,
      ram
    };

    console.log(`📝 FINAL LABEL:`, {
      serial: unit.serial_number,
      barcode: unit.barcode,
      productName,
      storage,
      ram,
      price
    });

    return label;
  }
}