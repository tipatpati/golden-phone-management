import { ProductUnitsService, ProductUnit } from "@/services/products/ProductUnitsService";
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
      // STEP 1: Force barcode backfill to ensure all units have unique barcodes
      console.log('🔧 FORCING barcode backfill to fix identical barcode issue...');
      const backfillResult = await ProductUnitsService.backfillMissingBarcodes();
      console.log('✅ Barcode backfill completed:', backfillResult);

      // STEP 2: Fetch units after backfill
      console.log(`📦 Fetching units for product ${product.id} after backfill...`);
      const units = await ProductUnitsService.getUnitsForProduct(product.id);
      console.log(`✅ Found ${units.length} units`);

      // STEP 3: Debug barcode uniqueness
      const barcodes = units.map(u => u.barcode).filter(Boolean);
      const uniqueBarcodes = new Set(barcodes);
      console.log('🔍 BARCODE UNIQUENESS CHECK:', {
        totalUnits: units.length,
        totalBarcodes: barcodes.length,
        uniqueBarcodes: uniqueBarcodes.size,
        areUnique: barcodes.length === uniqueBarcodes.size,
        barcodesList: units.map(u => ({ serial: u.serial_number, barcode: u.barcode }))
      });

      // STEP 4: Process each unit
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
          errors.push(`Unit ${unit.serial_number} missing barcode even after backfill`);
          console.error(`❌ Unit ${unit.serial_number} has no barcode`);
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

    for (let i = 0; i < quantity; i++) {
      const barcode = product.barcode || `GPMSBULK${product.id.slice(-4)}${i.toString().padStart(3, '0')}`;
      
      const label: ThermalLabelData = {
        productName,
        barcode,
        price: product.max_price ?? product.price ?? 0,
        category: product.category?.name,
        storage: product.storage || 128,
        ram: product.ram || 6
      };
      
      labels.push(label);
      console.log(`✅ Created generic label ${i + 1}/${quantity}`);
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