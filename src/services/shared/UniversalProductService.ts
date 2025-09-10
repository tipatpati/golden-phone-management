/**
 * UNIVERSAL PRODUCT SERVICE - ONE SOURCE OF TRUTH
 * This service ensures 100% consistency between supplier and inventory operations
 * Both modules MUST use this service for all product and unit operations
 */

import { supabase } from "@/integrations/supabase/client";
import { ProductUnitManagementService } from "./ProductUnitManagementService";
import { UnifiedProductCoordinator } from "./UnifiedProductCoordinator";
import type { 
  ProductFormData, 
  UnitEntryForm, 
  Product,
  InventoryOperationResult 
} from "@/services/inventory/types";

export interface UniversalProductOptions {
  source: 'inventory' | 'supplier';
  transactionId?: string;
  supplierId?: string;
  unitCost?: number;
  metadata?: Record<string, any>;
}

export interface UniversalProductResult {
  success: boolean;
  product: Product | null;
  units: any[];
  errors: string[];
  warnings: string[];
  isExistingProduct: boolean;
  createdUnitCount: number;
  updatedUnitCount: number;
}

/**
 * Universal Product Service - The ONLY way to create/update products and units
 * This ensures complete consistency between supplier and inventory modules
 */
class UniversalProductServiceClass {
  
  /**
   * UNIVERSAL PRODUCT CREATION/UPDATE
   * This is the ONLY method both modules should use for product operations
   */
  async processProduct(
    formData: ProductFormData,
    options: UniversalProductOptions
  ): Promise<UniversalProductResult> {
    console.log(`🎯 UNIVERSAL: Processing product from ${options.source}:`, formData.brand, formData.model);
    
    const result: UniversalProductResult = {
      success: false,
      product: null,
      units: [],
      errors: [],
      warnings: [],
      isExistingProduct: false,
      createdUnitCount: 0,
      updatedUnitCount: 0
    };

    try {
      // Step 1: Validate form data
      const validation = this.validateProductForm(formData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Step 2: Resolve product (create or find existing)
      const { product, isExisting } = await UnifiedProductCoordinator.resolveProduct(
        formData.brand,
        formData.model,
        {
          ...this.sanitizeProductData(formData),
          price: options.unitCost || formData.price,
          has_serial: formData.has_serial || (formData.unit_entries && formData.unit_entries.length > 0)
        }
      );

      result.product = this.transformProduct(product);
      result.isExistingProduct = isExisting;

      // Step 3: Process units if any
      if (formData.has_serial && formData.unit_entries && formData.unit_entries.length > 0) {
        const unitResult = await this.processProductUnits(
          product.id,
          formData.unit_entries,
          {
            price: options.unitCost || formData.price,
            min_price: formData.min_price,
            max_price: formData.max_price
          },
          options
        );

        result.units = unitResult.units;
        result.createdUnitCount = unitResult.createdCount;
        result.updatedUnitCount = unitResult.updatedCount;

        // Step 3.5: CRITICAL - Update product stock to match actual units count
        await this.updateProductStock(product.id, result.units.length);
        result.product.stock = result.units.length;
      } else if (!formData.has_serial && formData.stock) {
        // For non-serialized products, use the provided stock value
        await this.updateProductStock(product.id, formData.stock);
        result.product.stock = formData.stock;
      }

      // Step 4: Update stock count to match actual units for immediate UI consistency
      if (product.has_serial) {
        // For serialized products, count should match actual units
        console.log(`📊 Synchronizing stock count with actual units for product ${product.id}`);
        const actualStock = result.createdUnitCount + result.updatedUnitCount;
        await this.updateProductStock(product.id, result.units.length);
        
        // Update returned product object to show correct stock immediately
        result.product!.stock = result.units.length;
        console.log(`✅ Updated product stock to ${result.units.length} (${result.createdUnitCount} new + ${result.updatedUnitCount} updated units)`);
        
        // Force immediate UI refresh by invalidating caches
        UnifiedProductCoordinator.notifyEvent({
          type: 'stock_updated',
          source: options.source,
          entityId: product.id,
          metadata: {
            productId: product.id,
            newStock: result.units.length,
            unitCount: result.units.length
          }
        });
      } else {
        // For non-serialized products, update stock by the quantity being added
        if (options.source === 'supplier' && formData.stock !== undefined) {
          const newStock = (result.product!.stock || 0) + formData.stock;
          await this.updateProductStock(product.id, newStock);
          result.product!.stock = newStock;
          console.log(`✅ Updated non-serialized product stock to ${newStock}`);
          
          // Force immediate UI refresh
          UnifiedProductCoordinator.notifyEvent({
            type: 'stock_updated',
            source: options.source,
            entityId: product.id,
            metadata: {
              productId: product.id,
              newStock: newStock,
              unitCount: newStock
            }
          });
        }
      }

      // Step 5: Broadcast change for real-time sync
      UnifiedProductCoordinator.notifyEvent({
        type: isExisting ? 'product_updated' : 'product_created',
        source: options.source,
        entityId: product.id,
        metadata: {
          brand: formData.brand,
          model: formData.model,
          source: options.source,
          transactionId: options.transactionId,
          unitCost: options.unitCost,
          unitsProcessed: result.units.length,
          productId: product.id,
          ...options.metadata
        }
      });

      result.success = true;
      console.log(`✅ UNIVERSAL: Product processed successfully from ${options.source}`, {
        productId: result.product.id,
        isExisting: result.isExistingProduct,
        unitsCreated: result.createdUnitCount,
        unitsUpdated: result.updatedUnitCount
      });

    } catch (error) {
      console.error('❌ UNIVERSAL: Product processing failed:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * UNIVERSAL UNIT PROCESSING
   * Ensures units are created/updated consistently regardless of source
   */
  private async processProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    defaultPricing: { price?: number; min_price?: number; max_price?: number },
    options: UniversalProductOptions
  ): Promise<{ units: any[]; createdCount: number; updatedCount: number }> {
    console.log(`📦 UNIVERSAL: Processing ${unitEntries.length} units for product ${productId}`);

    // Get existing units
    const existingUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
    const existingSerials = new Set(existingUnits.map(u => u.serial_number));
    
    const newEntries = unitEntries.filter(e => e.serial?.trim() && !existingSerials.has(e.serial));
    const existingEntries = unitEntries.filter(e => e.serial?.trim() && existingSerials.has(e.serial));

    const allUnits: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    // Create new units
    if (newEntries.length > 0) {
      console.log(`🔨 [Unit Creation] Creating ${newEntries.length} new units for product ${productId}`);
      
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
              purchase_price: options.unitCost,
              supplier_id: options.supplierId,
              status: 'available'
            }
          );

          allUnits.push(unit);
          if (!isExisting) {
            createdCount++;
            console.log(`✅ [Unit Created] Successfully created unit ${unitEntry.serial} (ID: ${unit.id}) for product ${productId}`);
          } else {
            console.log(`♻️ [Unit Exists] Unit ${unitEntry.serial} already exists for product ${productId}`);
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
          console.error(`❌ [Unit Creation Failed] Failed to create unit ${unitEntry.serial} for product ${productId}:`, error);
          throw error;
        }
      }
    }

    // Update existing units if needed
    if (existingEntries.length > 0) {
      console.log(`🔄 [Unit Update] Updating ${existingEntries.length} existing units for product ${productId}`);
      
      for (const unitEntry of existingEntries) {
        try {
          const existingUnit = existingUnits.find(u => u.serial_number === unitEntry.serial);
          if (existingUnit) {
            // Update unit with new data
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

            allUnits.push(updatedUnit);
            updatedCount++;
            console.log(`✅ [Unit Updated] Successfully updated unit ${unitEntry.serial} (ID: ${updatedUnit.id}) for product ${productId}`);

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
          console.error(`❌ [Unit Update Failed] Failed to update unit ${unitEntry.serial} for product ${productId}:`, error);
          // Don't throw here, just log the error
        }
      }
    }

    // Add existing units that weren't in the update list
    const unmodifiedUnits = existingUnits.filter(u => 
      !unitEntries.some(e => e.serial === u.serial_number)
    );
    allUnits.push(...unmodifiedUnits);

    console.log(`✅ UNIVERSAL: Unit processing complete`, {
      total: allUnits.length,
      created: createdCount,
      updated: updatedCount,
      unmodified: unmodifiedUnits.length
    });

    return { units: allUnits, createdCount, updatedCount };
  }

  /**
   * Validate product form data
   */
  private validateProductForm(formData: ProductFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!formData.brand?.trim()) {
      errors.push('Brand is required');
    }
    if (!formData.model?.trim()) {
      errors.push('Model is required');
    }
    if (!formData.price || formData.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    // Serial number validation for serialized products
    if (formData.has_serial && formData.unit_entries) {
      const serialNumbers = new Set<string>();
      for (const [index, entry] of formData.unit_entries.entries()) {
        if (!entry.serial?.trim()) {
          errors.push(`Unit ${index + 1}: Serial number is required`);
        } else if (serialNumbers.has(entry.serial)) {
          errors.push(`Unit ${index + 1}: Duplicate serial number: ${entry.serial}`);
        } else {
          serialNumbers.add(entry.serial);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize product data to include only valid database columns
   */
  private sanitizeProductData(formData: ProductFormData): Record<string, any> {
    const allowedKeys = new Set([
      'price','stock','threshold','has_serial','category_id','barcode',
      'description','supplier','year','min_price','max_price','serial_numbers'
    ]);
    
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (allowedKeys.has(key) && value !== undefined) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Transform database product to our Product interface
   */
  private transformProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      brand: dbProduct.brand,
      model: dbProduct.model,
      price: dbProduct.price,
      min_price: dbProduct.min_price,
      max_price: dbProduct.max_price,
      stock: dbProduct.stock,
      threshold: dbProduct.threshold,
      has_serial: dbProduct.has_serial,
      category_id: dbProduct.category_id,
      category: dbProduct.category,
      barcode: dbProduct.barcode,
      description: dbProduct.description,
      supplier: dbProduct.supplier,
      year: dbProduct.year,
      serial_numbers: dbProduct.serial_numbers,
      created_at: dbProduct.created_at,
      updated_at: dbProduct.updated_at
    };
  }

  /**
   * UNIVERSAL PRODUCT DELETION
   * Ensures consistent deletion across modules
   */
  async deleteProduct(
    productId: string,
    options: UniversalProductOptions
  ): Promise<{ success: boolean; errors: string[] }> {
    console.log(`🗑️ UNIVERSAL: Deleting product from ${options.source}:`, productId);
    
    try {
      // First delete all units
      const { error: unitsError } = await supabase
        .from('product_units')
        .delete()
        .eq('product_id', productId);

      if (unitsError) {
        throw new Error(`Failed to delete product units: ${unitsError.message}`);
      }

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) {
        throw new Error(`Failed to delete product: ${productError.message}`);
      }

      // Notify about product deletion
      UnifiedProductCoordinator.notifyEvent({
        type: 'sync_requested',
        source: options.source,
        entityId: productId,
        metadata: {
          action: 'product_deleted',
          source: options.source,
          productId,
          ...options.metadata
        }
      });

      console.log('✅ UNIVERSAL: Product deleted successfully:', productId);
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('❌ UNIVERSAL: Failed to delete product:', error);
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * GET PRODUCT WITH UNITS
   * Consistent way to fetch product data across modules
   */
  async getProductWithUnits(productId: string): Promise<{
    product: Product | null;
    units: any[];
    unitEntries: UnitEntryForm[];
  }> {
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

      // Get units
      const units = await ProductUnitManagementService.getUnitsForProduct(productId);
      
      // Convert units to unit entries format
      const unitEntries: UnitEntryForm[] = units.map(unit => ({
        serial: unit.serial_number,
        battery_level: unit.battery_level,
        color: unit.color,
        storage: unit.storage,
        ram: unit.ram,
        price: unit.price,
        min_price: unit.min_price,
        max_price: unit.max_price
      }));

      return {
        product: this.transformProduct(product),
        units,
        unitEntries
      };

    } catch (error) {
      console.error('❌ UNIVERSAL: Failed to get product with units:', error);
      return {
        product: null,
        units: [],
        unitEntries: []
      };
    }
  }

  /**
   * Update product stock count to match actual units
   */
  private async updateProductStock(productId: string, newStock: number): Promise<void> {
    console.log(`📊 [Stock Database] Updating product ${productId} stock in database to ${newStock}`);
    
    const { error } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error('❌ [Stock Database] Failed to update product stock:', error);
      throw new Error(`Failed to update product stock: ${error.message}`);
    }

    console.log(`✅ [Stock Database] Product ${productId} stock successfully updated to ${newStock}`);
  }
}

export const universalProductService = new UniversalProductServiceClass();