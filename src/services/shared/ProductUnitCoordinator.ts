/**
 * PRODUCT UNIT COORDINATOR
 * Single system managing ALL product unit operations across inventory and supplier modules
 * This is the ONLY service that should handle unit CRUD operations
 */

import { supabase } from "@/integrations/supabase/client";
import { ProductUnitManagementService } from "./ProductUnitManagementService";
import { UnifiedProductCoordinator } from "./UnifiedProductCoordinator";
import { universalBarcodeService } from "./UniversalBarcodeService";
import type { 
  BaseUnit, 
  UnitFormData, 
  UnitOperationOptions, 
  UnitOperationResult,
  ProductWithUnitsData,
  BarcodeGenerationResult,
  LabelPrintingResult
} from "@/types/units";

/**
 * Centralized Product Unit Coordinator
 * The ONLY place where unit operations should be performed
 */
class ProductUnitCoordinatorClass {

  /**
   * UNIVERSAL UNIT PROCESSING
   * Handles creation, updates, and synchronization of units from any source
   */
  async processUnits(
    productId: string,
    unitFormData: UnitFormData[],
    defaultPricing: { price?: number; min_price?: number; max_price?: number },
    options: UnitOperationOptions
  ): Promise<UnitOperationResult> {
    console.log(`🎯 UNIT COORDINATOR: Processing ${unitFormData.length} units for product ${productId} from ${options.source}`);

    const result: UnitOperationResult = {
      success: false,
      units: [],
      createdCount: 0,
      updatedCount: 0,
      errors: [],
      warnings: []
    };

    try {
      // Get existing units
      const existingUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
      const existingSerials = new Set(existingUnits.map(u => u.serial_number));
      
      const newEntries = unitFormData.filter(e => e.serial?.trim() && !existingSerials.has(e.serial));
      const existingEntries = unitFormData.filter(e => e.serial?.trim() && existingSerials.has(e.serial));

      const allUnits: BaseUnit[] = [];

      // Create new units
      if (newEntries.length > 0) {
        for (const unitEntry of newEntries) {
          try {
            const { unit, isExisting } = await UnifiedProductCoordinator.resolveProductUnit(
              productId,
              unitEntry.serial,
              {
                price: unitEntry.price || defaultPricing.price,
                min_price: unitEntry.min_price || defaultPricing.min_price,
                max_price: unitEntry.max_price || defaultPricing.max_price,
                battery_level: unitEntry.battery_level,
                color: unitEntry.color,
                storage: unitEntry.storage,
                ram: unitEntry.ram,
                barcode: unitEntry.barcode,
                purchase_price: options.unitCost,
                supplier_id: options.supplierId,
                status: 'available'
              }
            );

            allUnits.push(unit as BaseUnit);
            if (!isExisting) {
              result.createdCount++;
              console.log(`✅ Created unit ${unitEntry.serial} for product ${productId}`);
            }

            // Notify about unit creation
            UnifiedProductCoordinator.notifyEvent({
              type: isExisting ? 'unit_updated' : 'unit_created',
              source: options.source,
              entityId: unit.id,
              metadata: {
                productId,
                serialNumber: unitEntry.serial,
                source: options.source,
                transactionId: options.transactionId,
                unitCost: options.unitCost,
                ...options.metadata
              }
            });

          } catch (error) {
            console.error(`❌ Failed to create unit ${unitEntry.serial}:`, error);
            result.errors.push(`Failed to create unit ${unitEntry.serial}: ${error.message}`);
          }
        }
      }

      // Update existing units
      if (existingEntries.length > 0) {
        for (const unitEntry of existingEntries) {
          try {
            const existingUnit = existingUnits.find(u => u.serial_number === unitEntry.serial);
            if (existingUnit) {
              const { data: updatedUnit, error } = await supabase
                .from('product_units')
                .update({
                  price: unitEntry.price || defaultPricing.price,
                  min_price: unitEntry.min_price || defaultPricing.min_price,
                  max_price: unitEntry.max_price || defaultPricing.max_price,
                  battery_level: unitEntry.battery_level,
                  color: unitEntry.color,
                  storage: unitEntry.storage,
                  ram: unitEntry.ram,
                  barcode: unitEntry.barcode,
                  purchase_price: options.unitCost,
                  supplier_id: options.supplierId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingUnit.id)
                .select()
                .single();

              if (error) {
                throw new Error(`Failed to update unit: ${error.message}`);
              }

              allUnits.push(updatedUnit as BaseUnit);
              result.updatedCount++;
              console.log(`✅ Updated unit ${unitEntry.serial} for product ${productId}`);

              // Notify about unit update
              UnifiedProductCoordinator.notifyEvent({
                type: 'unit_updated',
                source: options.source,
                entityId: updatedUnit.id,
                metadata: {
                  productId,
                  serialNumber: unitEntry.serial,
                  source: options.source,
                  transactionId: options.transactionId,
                  unitCost: options.unitCost,
                  ...options.metadata
                }
              });
            }
          } catch (error) {
            console.error(`❌ Failed to update unit ${unitEntry.serial}:`, error);
            result.errors.push(`Failed to update unit ${unitEntry.serial}: ${error.message}`);
          }
        }
      }

      // Add unmodified units
      const unmodifiedUnits = existingUnits.filter(u => 
        !unitFormData.some(e => e.serial === u.serial_number)
      );
      allUnits.push(...(unmodifiedUnits as BaseUnit[]));

      result.units = allUnits;
      result.success = result.errors.length === 0;

      console.log(`✅ UNIT COORDINATOR: Processed units`, {
        total: allUnits.length,
        created: result.createdCount,
        updated: result.updatedCount,
        unmodified: unmodifiedUnits.length,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to process units:', error);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * GET PRODUCT WITH UNITS
   * Unified method to fetch product data with units in consistent format
   */
  async getProductWithUnits(productId: string): Promise<ProductWithUnitsData> {
    try {
      // Get product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('id', productId)
        .single();

      if (productError) {
        throw new Error(`Failed to fetch product: ${productError.message}`);
      }

      // Get units using unified service
      const units = await ProductUnitManagementService.getUnitsForProduct(productId);
      
      // Convert to form data format for UI consistency
      const unitEntries: UnitFormData[] = units.map(unit => ({
        serial: unit.serial_number,
        barcode: unit.barcode,
        battery_level: unit.battery_level,
        color: unit.color,
        storage: unit.storage,
        ram: unit.ram,
        price: unit.price,
        min_price: unit.min_price,
        max_price: unit.max_price
      }));

      return {
        product,
        units,
        unitEntries
      };

    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to get product with units:', error);
      return {
        product: null,
        units: [],
        unitEntries: []
      };
    }
  }

  /**
   * GENERATE BARCODES FOR UNITS
   * Unified barcode generation across all modules
   */
  async generateBarcodesForUnits(
    productId: string,
    units: UnitFormData[],
    options: UnitOperationOptions
  ): Promise<BarcodeGenerationResult> {
    try {
      const result = await universalBarcodeService.generateBarcodesForUnits(
        productId,
        units,
        options.source
      );

      return {
        success: result.success,
        barcodes: result.barcodes,
        errors: result.errors
      };
    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to generate barcodes:', error);
      return {
        success: false,
        barcodes: [],
        errors: [error.message]
      };
    }
  }

  /**
   * PRINT LABELS FOR UNITS
   * Unified label printing across all modules
   */
  async printLabelsForUnits(
    productId: string,
    productBrand: string,
    productModel: string,
    units: UnitFormData[],
    options: UnitOperationOptions
  ): Promise<LabelPrintingResult> {
    try {
      const unitsForPrinting = units.map(unit => ({
        serial: unit.serial,
        barcode: unit.barcode || `${productId}_${unit.serial}`,
        color: unit.color,
        storage: unit.storage,
        ram: unit.ram,
        price: unit.price
      }));

      const result = await universalBarcodeService.printLabelsForUnits({
        productId,
        productBrand,
        productModel,
        units: unitsForPrinting,
        source: options.source,
        metadata: {
          printedAt: new Date().toISOString(),
          ...options.metadata
        }
      });

      return {
        success: result.success,
        totalLabels: result.totalLabels,
        printedUnits: result.printedUnits,
        errors: result.errors
      };
    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to print labels:', error);
      return {
        success: false,
        totalLabels: 0,
        printedUnits: [],
        errors: [error.message]
      };
    }
  }

  /**
   * DELETE UNITS FOR PRODUCT
   * Safe deletion of units when product is being removed
   */
  async deleteUnitsForProduct(productId: string, options: UnitOperationOptions): Promise<{ success: boolean; errors: string[] }> {
    try {
      const { error } = await supabase
        .from('product_units')
        .delete()
        .eq('product_id', productId);

      if (error) {
        throw new Error(`Failed to delete units: ${error.message}`);
      }

      console.log(`✅ UNIT COORDINATOR: Deleted all units for product ${productId}`);
      
      // Notify about units deletion
      UnifiedProductCoordinator.notifyEvent({
        type: 'sync_requested' as const,
        source: options.source,
        entityId: productId,
        metadata: {
          productId,
          source: options.source,
          ...options.metadata
        }
      });

      return { success: true, errors: [] };
    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to delete units:', error);
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * TRANSFORM DATABASE UNIT TO FORM DATA
   * Consistent transformation for UI components
   */
  transformUnitToFormData(unit: BaseUnit): UnitFormData {
    return {
      serial: unit.serial_number,
      barcode: unit.barcode,
      battery_level: unit.battery_level,
      color: unit.color,
      storage: unit.storage,
      ram: unit.ram,
      price: unit.price,
      min_price: unit.min_price,
      max_price: unit.max_price
    };
  }

  /**
   * BATCH OPERATIONS
   * Handle multiple unit operations efficiently
   */
  async batchProcessUnits(
    operations: Array<{
      productId: string;
      units: UnitFormData[];
      pricing: { price?: number; min_price?: number; max_price?: number };
      options: UnitOperationOptions;
    }>
  ): Promise<UnitOperationResult[]> {
    const results: UnitOperationResult[] = [];

    for (const op of operations) {
      const result = await this.processUnits(op.productId, op.units, op.pricing, op.options);
      results.push(result);
    }

    return results;
  }
}

export const productUnitCoordinator = new ProductUnitCoordinatorClass();