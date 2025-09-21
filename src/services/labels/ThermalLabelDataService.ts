import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import type { ProductUnit } from "@/services/inventory/types";
import { formatProductName, formatProductUnitName } from "@/utils/productNaming";
import { LabelDataValidator } from "./LabelDataValidator";
import { ProductForLabels, ThermalLabelData, LabelDataResult } from "./types";
import { Services } from "@/services/core/Services";

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

      // Check if product has serialized units (primary check)
      // Use serial_numbers as indicator of serialized product (extracted from units)
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Product has serialized units - fetch and process them
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
        // Product without serialized units - generate generic labels
        const productLabels = await this.processProductWithoutUnits(
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
   * PHASE 1: Enhanced with comprehensive unit+barcode fetching query
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
      // PHASE 1: Comprehensive unit+barcode fetching with cross-module validation
      console.log(`📦 Fetching units for product ${product.id} with comprehensive barcode data...`);
      
      // Fetch units with barcodes from all sources (inventory + supplier modules)
      const units = await ProductUnitManagementService.getUnitsForProduct(product.id);
      console.log(`✅ Found ${units.length} units from ProductUnitManagementService`);
      
      // PHASE 3: Use BarcodeAuthority as single source of truth
      const barcodeAuthority = Services.getBarcodeAuthority();
      
      // Cross-module data validation - ensure supplier-created units are included
      for (const unit of units) {
        if (unit.barcode) {
          // Validate existing barcode integrity using authority
          const validation = barcodeAuthority.validateBarcode(unit.barcode);
          if (!validation.isValid) {
            warnings.push(`Unit ${unit.serial_number} has invalid barcode: ${unit.barcode}`);
          }
          
          // Verify barcode integrity
          barcodeAuthority.verifyBarcodeIntegrity(unit.barcode, 'existing');
        }
      }

      // Process each unit, generating missing barcodes
      for (const unit of units) {
        let unitBarcode = unit.barcode;
        
        // Auto-generate unit barcode if missing using BarcodeAuthority
        if (!unitBarcode) {
          try {
            console.log(`🔨 Generating missing unit barcode for ${unit.serial_number} via BarcodeAuthority...`);
            unitBarcode = await barcodeAuthority.generateUnitBarcode(unit.id);
            console.log(`✅ Generated unit barcode via BarcodeAuthority: ${unitBarcode}`);
            
            // Verify the generated barcode
            if (!barcodeAuthority.verifyBarcodeIntegrity(unitBarcode, 'generated')) {
              throw new Error('Generated barcode failed integrity check');
            }
          } catch (error) {
            console.error(`❌ Failed to generate unit barcode for ${unit.serial_number}:`, error);
            unitsMissingBarcodes++;
            warnings.push(`Failed to generate barcode for unit ${unit.serial_number}`);
            continue;
          }
        }

        const label = this.createUnitLabel({...unit, barcode: unitBarcode}, product, cleanBrand, cleanModel);
        if (label) {
          labels.push(label);
          unitsWithBarcodes++;
          console.log(`✅ Label created: ${unit.serial_number} → ${unitBarcode}`);
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
  private static async processProductWithoutUnits(
    product: ProductForLabels,
    cleanBrand: string,
    cleanModel: string
  ): Promise<LabelDataResult> {
    console.log(`📦 Processing bulk product: ${product.id}`);
    
    const labels: ThermalLabelData[] = [];
    const quantity = Math.max(1, Math.min(product.stock || 1, 10));
    const productName = formatProductName({ 
      brand: cleanBrand, 
      model: cleanModel 
    });

    // Auto-generate product barcode if missing using BarcodeAuthority
    let productBarcode = product.barcode;
    if (!productBarcode) {
      try {
        console.log(`🔨 Generating missing product barcode for ${product.id} via BarcodeAuthority...`);
        const barcodeAuthority = Services.getBarcodeAuthority();
        productBarcode = await barcodeAuthority.generateProductBarcode(product.id);
        console.log(`✅ Generated product barcode via BarcodeAuthority: ${productBarcode}`);
        
        // Verify the generated barcode
        if (!barcodeAuthority.verifyBarcodeIntegrity(productBarcode, 'generated')) {
          throw new Error('Generated barcode failed integrity check');
        }
      } catch (error) {
        console.error(`❌ Failed to generate product barcode for ${product.id}:`, error);
        return {
          success: false,
          labels: [],
          errors: [`Failed to generate barcode for product ${cleanBrand} ${cleanModel}`],
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
    } else {
      // Validate existing product barcode
      const barcodeAuthority = Services.getBarcodeAuthority();
      const validation = barcodeAuthority.validateBarcode(productBarcode);
      if (!validation.isValid) {
        console.warn(`⚠️ Product ${product.id} has invalid barcode: ${productBarcode}`);
      }
    }

    for (let i = 0; i < quantity; i++) {
      const label: ThermalLabelData = {
        productName,
        barcode: productBarcode, // Use existing or generated product barcode
        price: product.max_price ?? product.price ?? 0,
        category: product.category?.name,
        storage: product.storage || 128,
        ram: product.ram || 6,
        batteryLevel: undefined // Generic labels don't have specific battery info
      };
      
      labels.push(label);
      console.log(`✅ Created generic label ${i + 1}/${quantity} using barcode: ${productBarcode}`);
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

    // Resolve pricing with hierarchy: unit max_price > unit price > product max_price > product price > 0
    const price = unit.max_price ?? unit.price ?? product.max_price ?? product.price ?? 0;
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