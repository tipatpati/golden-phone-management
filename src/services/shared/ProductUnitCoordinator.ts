/**
 * PRODUCT UNIT COORDINATOR
 * Single system managing ALL product unit operations across inventory and supplier modules
 * This is the ONLY service that should handle unit CRUD operations
 */

import { supabase } from "@/integrations/supabase/client";
import { ProductUnitManagementService } from "./ProductUnitManagementService";
import { UnifiedProductCoordinator } from "./UnifiedProductCoordinator";
import { Code128GeneratorService } from "@/services/barcodes/Code128GeneratorService";
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
   * Generates barcodes for existing units in the database
   */
  async generateBarcodesForUnits(
    productId: string,
    units: UnitFormData[],
    source: string
  ): Promise<BarcodeGenerationResult> {
    try {
      console.log(`🎯 UNIT COORDINATOR: Generating barcodes for ${units.length} units from ${source}`);
      
      const barcodes: Array<{ serial: string; barcode: string }> = [];
      const errors: string[] = [];

      // Get all existing units for this product
      const existingUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
      
      for (const unit of units) {
        if (!unit.serial?.trim()) {
          errors.push('Unit missing serial number');
          continue;
        }

        try {
          // Find the existing unit
          const unitRecord = existingUnits.find(u => u.serial_number === unit.serial);
          
          if (!unitRecord) {
            errors.push(`Unit ${unit.serial} not found in database. Please save the product first.`);
            continue;
          }

          // Check if unit already has a barcode
          if (unitRecord.barcode) {
            barcodes.push({ serial: unit.serial, barcode: unitRecord.barcode });
            console.log(`✅ Using existing barcode for ${unit.serial}: ${unitRecord.barcode}`);
            continue;
          }

          // Generate new barcode using the unit's UUID
          const barcode = await Code128GeneratorService.generateUnitBarcode(unitRecord.id);
          
          // Update the unit with the new barcode
          const { error: updateError } = await supabase
            .from('product_units')
            .update({ barcode })
            .eq('id', unitRecord.id);

          if (updateError) {
            throw new Error(`Failed to update unit with barcode: ${updateError.message}`);
          }
          
          barcodes.push({ serial: unit.serial, barcode });
          console.log(`✅ Generated and saved barcode for ${unit.serial}: ${barcode}`);
        } catch (error) {
          console.error(`❌ Failed to generate barcode for ${unit.serial}:`, error);
          errors.push(`Failed to generate barcode for ${unit.serial}: ${error.message}`);
        }
      }

      return {
        success: barcodes.length > 0,
        barcodes,
        errors
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
   * Uses the sophisticated ThermalLabelDataService for high-quality thermal labels
   */
  async printLabelsForUnits(
    productId: string,
    productBrand: string,
    productModel: string,
    units: UnitFormData[],
    options: UnitOperationOptions
  ): Promise<LabelPrintingResult> {
    try {
      console.log(`🎯 UNIT COORDINATOR: Printing thermal labels for ${units.length} units from ${options.source}`);

      // Get product data for thermal label generation
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

      // Convert units to ProductForLabels format
      const productsForLabels = [{
        id: productId,
        brand: productBrand,
        model: productModel,
        price: product.price,
        min_price: product.min_price,
        max_price: product.max_price,
        category: product.category,
        serial_numbers: units.map(u => u.serial).filter(Boolean),
        storage: units[0]?.storage || undefined,
        ram: units[0]?.ram || undefined,
        year: product.year
      }];

      // Import the sophisticated ThermalLabelDataService
      const { ThermalLabelDataService } = await import('@/services/labels/ThermalLabelDataService');
      
      // Generate high-quality thermal label data
      const labelResult = await ThermalLabelDataService.generateLabelsForProducts(
        productsForLabels,
        { useMasterBarcode: false }
      );

      if (!labelResult.success || labelResult.labels.length === 0) {
        throw new Error(`Failed to generate thermal labels: ${labelResult.errors.join(', ')}`);
      }

      // Use the unified print service
      const { Services } = await import('@/services/core');
      
      const printService = await Services.getPrintService();
      const printResult = await printService.printLabels(labelResult.labels.map(label => ({
        id: label.barcode || Math.random().toString(),
        productName: label.productName,
        brand: "GPMS",
        model: label.productName,
        price: label.price,
        barcode: label.barcode,
        serial: label.serialNumber,
        color: label.color,
        storage: label.storage?.toString(),
        ram: label.ram?.toString()
      })), {
        copies: 1,
        companyName: "GOLDEN PHONE SRL",
        showPrice: true,
        showSerial: true
      });

      console.log(`✅ UNIT COORDINATOR: Thermal label printing completed`, printResult);

      return {
        success: printResult.success,
        totalLabels: printResult.totalLabels || labelResult.labels.length,
        printedUnits: units.map(u => u.serial).filter(Boolean),
        errors: printResult.success ? [] : [printResult.message]
      };

    } catch (error) {
      console.error('❌ UNIT COORDINATOR: Failed to print thermal labels:', error);
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