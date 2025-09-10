/**
 * UNIVERSAL BARCODE SERVICE - ONE SOURCE FOR ALL BARCODE OPERATIONS
 * This service ensures consistent barcode generation and label printing across all modules
 */

import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from "@/services/barcodes/Code128GeneratorService";
import type { UnitEntryForm } from "@/services/inventory/types";

export interface UniversalLabelData {
  productId: string;
  productBrand: string;
  productModel: string;
  units: Array<{
    serial: string;
    barcode: string;
    color?: string;
    storage?: number;
    ram?: number;
    price?: number;
  }>;
  source: 'inventory' | 'supplier';
  metadata?: Record<string, any>;
}

export interface UniversalPrintResult {
  success: boolean;
  totalLabels: number;
  errors: string[];
  printedUnits: string[];
}

/**
 * Universal Barcode Service - ONE source for all barcode operations
 * Both supplier and inventory modules use this for consistency
 */
class UniversalBarcodeServiceClass {

  /**
   * UNIVERSAL BARCODE GENERATION FOR UNITS
   * Generates barcodes for product units consistently across modules
   */
  async generateBarcodesForUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    source: 'inventory' | 'supplier'
  ): Promise<{
    success: boolean;
    barcodes: Array<{ serial: string; barcode: string; unitId?: string }>;
    errors: string[];
  }> {
    console.log(`📊 UNIVERSAL BARCODE: Generating barcodes for ${unitEntries.length} units from ${source}`);
    
    const result = {
      success: false,
      barcodes: [] as Array<{ serial: string; barcode: string; unitId?: string }>,
      errors: [] as string[]
    };

    try {
      // Use Code128GeneratorService directly for reliable barcode generation
      for (const unit of unitEntries) {
        if (!unit.serial?.trim()) {
          result.errors.push(`Skipping unit without serial number`);
          continue;
        }

        try {
          // Generate barcode using the direct service
          const barcode = await Code128GeneratorService.generateUnitBarcode(`${productId}_${unit.serial}`, {
            metadata: {
              serial: unit.serial,
              color: unit.color,
              storage: unit.storage,
              ram: unit.ram,
              source
            }
          });

          // Check if unit exists in database and update barcode
          const { data: existingUnit } = await supabase
            .from('product_units')
            .select('id')
            .eq('product_id', productId)
            .eq('serial_number', unit.serial)
            .maybeSingle();

          if (existingUnit) {
            // Update unit barcode in database
            await supabase
              .from('product_units')
              .update({ 
                barcode,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUnit.id);

            result.barcodes.push({
              serial: unit.serial,
              barcode,
              unitId: existingUnit.id
            });
          } else {
            // Unit doesn't exist yet, just return the barcode
            result.barcodes.push({
              serial: unit.serial,
              barcode
            });
          }

          console.log(`✅ Generated barcode for ${unit.serial}: ${barcode}`);

        } catch (error) {
          console.error(`❌ Failed to generate barcode for ${unit.serial}:`, error);
          result.errors.push(`Failed to generate barcode for ${unit.serial}: ${error.message}`);
        }
      }

      result.success = result.barcodes.length > 0;
      console.log(`✅ UNIVERSAL BARCODE: Generated ${result.barcodes.length} barcodes, ${result.errors.length} errors`);

    } catch (error) {
      console.error('❌ UNIVERSAL BARCODE: Generation failed:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * UNIVERSAL LABEL PRINTING
   * Prints thermal labels consistently across all modules
   */
  async printLabelsForUnits(
    labelData: UniversalLabelData
  ): Promise<UniversalPrintResult> {
    console.log(`🖨️ UNIVERSAL PRINT: Printing ${labelData.units.length} labels from ${labelData.source}`);

    const result: UniversalPrintResult = {
      success: false,
      totalLabels: 0,
      errors: [],
      printedUnits: []
    };

    try {
      // Use the unified print service
      const { Services } = await import('@/services/core');
      
      // Convert to service-compatible thermal labels
      const serviceLabelData = labelData.units.map(unit => ({
        id: unit.barcode || Math.random().toString(),
        productName: `${labelData.productBrand} ${labelData.productModel}`,
        brand: labelData.productBrand,
        model: labelData.productModel,
        price: unit.price || 0,
        barcode: unit.barcode,
        serial: unit.serial,
        color: unit.color,
        storage: unit.storage?.toString(),
        ram: unit.ram?.toString()
      }));

      // Use unified print service
      const printService = await Services.getPrintService();
      const result = await printService.printLabels(serviceLabelData, {
        copies: 1,
        companyName: "GOLDEN PHONE SRL",
        showPrice: true,
        showSerial: true
      });

      if (result.success) {
        // Create a custom result object for universal service
        const customResult = {
          success: true,
          totalLabels: result.totalLabels || serviceLabelData.length,
          printedUnits: labelData.units.map(u => u.serial),
          errors: [] as string[]
        };
        Object.assign(result, customResult);

        // Log the successful print operation
        console.log(`✅ UNIVERSAL PRINT: Successfully printed ${result.totalLabels} thermal labels`);

        // Record print history in database for tracking
        try {
          await supabase
            .from('barcode_registry')
            .insert(
              labelData.units.map(unit => ({
                barcode: unit.barcode,
                entity_type: 'product_unit',
                entity_id: labelData.productId,
                barcode_type: 'unit',
                format: 'CODE128',
                metadata: {
                  serial: unit.serial,
                  printed_at: new Date().toISOString(),
                  printed_from: labelData.source,
                  product_brand: labelData.productBrand,
                  product_model: labelData.productModel,
                  ...labelData.metadata
                }
              }))
            );
        } catch (registryError) {
          console.warn('Failed to record print history:', registryError);
          // Don't fail the whole operation for registry issues
        }

      } else {
        // Create errors array if it doesn't exist
        if (!(result as any).errors) (result as any).errors = [];
        (result as any).errors.push(result.message || 'Unknown print error');
      }

    } catch (error) {
      console.error('❌ UNIVERSAL PRINT: Failed to print labels:', error);
      if (!(result as any).errors) (result as any).errors = [];
      (result as any).errors.push((error as Error).message);
    }

    return result;
  }

  /**
   * UNIVERSAL: Generate and Print - All-in-one operation
   * This is the main method both modules should use
   */
  async generateAndPrintLabels(
    productId: string,
    productBrand: string,
    productModel: string,
    unitEntries: UnitEntryForm[],
    source: 'inventory' | 'supplier',
    metadata?: Record<string, any>
  ): Promise<UniversalPrintResult> {
    console.log(`🎯 UNIVERSAL: Generate and print labels for ${unitEntries.length} units from ${source}`);

    const result: UniversalPrintResult = {
      success: false,
      totalLabels: 0,
      errors: [],
      printedUnits: []
    };

    try {
      // Step 1: Generate barcodes for all units
      const barcodeResult = await this.generateBarcodesForUnits(productId, unitEntries, source);
      
      if (!barcodeResult.success || barcodeResult.barcodes.length === 0) {
        result.errors.push(...barcodeResult.errors);
        result.errors.push('No barcodes generated');
        return result;
      }

      // Step 2: Prepare label data
      const labelData: UniversalLabelData = {
        productId,
        productBrand,
        productModel,
        units: barcodeResult.barcodes.map(bc => {
          const unitEntry = unitEntries.find(u => u.serial === bc.serial);
          return {
            serial: bc.serial,
            barcode: bc.barcode,
            color: unitEntry?.color,
            storage: unitEntry?.storage,
            ram: unitEntry?.ram,
            price: unitEntry?.price
          };
        }),
        source,
        metadata
      };

      // Step 3: Print labels
      const printResult = await this.printLabelsForUnits(labelData);
      
      result.success = printResult.success;
      result.totalLabels = printResult.totalLabels;
      result.errors.push(...printResult.errors);
      result.printedUnits = printResult.printedUnits;

      if (result.success) {
        console.log(`✅ UNIVERSAL: Successfully generated and printed ${result.totalLabels} labels`);
      }

    } catch (error) {
      console.error('❌ UNIVERSAL: Generate and print failed:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * GET UNIT BARCODES
   * Retrieve existing barcodes for units
   */
  async getUnitBarcodes(productId: string): Promise<Record<string, string>> {
    try {
      const { data: units } = await supabase
        .from('product_units')
        .select('serial_number, barcode')
        .eq('product_id', productId)
        .not('barcode', 'is', null);

      const barcodeMap: Record<string, string> = {};
      if (units) {
        units.forEach(unit => {
          if (unit.serial_number && unit.barcode) {
            barcodeMap[unit.serial_number] = unit.barcode;
          }
        });
      }

      return barcodeMap;

    } catch (error) {
      console.error('❌ Failed to get unit barcodes:', error);
      return {};
    }
  }
}

export const universalBarcodeService = new UniversalBarcodeServiceClass();