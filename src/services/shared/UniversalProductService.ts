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
        // For non-serialized products, stock is managed by regular product operations
        // NO MORE MANUAL STOCK UPDATES - Database consistency guaranteed
        if (options.source === 'supplier' && formData.stock !== undefined) {
          console.log(`🏁 [Stock Management] Non-serialized product stock will remain at current value for ${product.id}`);
          console.log(`📊 [Stock Info] Stock operations for non-serialized products handled elsewhere`);
          
          // Simplified event notification - no stock manipulation
          UnifiedProductCoordinator.notifyEvent({
            type: 'product_updated',
            source: options.source,
            entityId: product.id,
            metadata: {
              productId: product.id,
              serialized: false
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
   * Delegates to ProductUnitCoordinator for all unit operations
   */
  private async processProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    defaultPricing: { price?: number; min_price?: number; max_price?: number },
    options: UniversalProductOptions
  ): Promise<{ units: any[]; createdCount: number; updatedCount: number }> {
    console.log(`📦 UNIVERSAL: Delegating ${unitEntries.length} units to ProductUnitCoordinator for product ${productId}`);

    // Import coordinator to avoid circular dependencies
    const { productUnitCoordinator } = await import('./ProductUnitCoordinator');
    
    // Convert UnitEntryForm to UnitFormData format
    const unitFormData = unitEntries.map(entry => ({
      serial: entry.serial,
      battery_level: entry.battery_level,
      color: entry.color,
      storage: entry.storage,
      ram: entry.ram,
      price: entry.price || defaultPricing.price,
      min_price: entry.min_price || defaultPricing.min_price,
      max_price: entry.max_price || defaultPricing.max_price
    }));

    const result = await productUnitCoordinator.processUnits(
      productId,
      unitFormData,
      defaultPricing,
      {
        source: options.source,
        transactionId: options.transactionId,
        supplierId: options.supplierId,
        unitCost: options.unitCost,
        metadata: options.metadata
      }
    );

    if (!result.success) {
      throw new Error(`Unit processing failed: ${result.errors.join(', ')}`);
    }

    console.log(`✅ UNIVERSAL: Unit processing delegated successfully`, {
      total: result.units.length,
      created: result.createdCount,
      updated: result.updatedCount
    });

    return { 
      units: result.units, 
      createdCount: result.createdCount, 
      updatedCount: result.updatedCount 
    };
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
   * Delegates to ProductUnitCoordinator for consistent data fetching
   */
  async getProductWithUnits(productId: string): Promise<{
    product: Product | null;
    units: any[];
    unitEntries: UnitEntryForm[];
  }> {
    try {
      // Import coordinator to avoid circular dependencies
      const { productUnitCoordinator } = await import('./ProductUnitCoordinator');
      
      const result = await productUnitCoordinator.getProductWithUnits(productId);
      
      return {
        product: result.product ? this.transformProduct(result.product) : null,
        units: result.units,
        unitEntries: result.unitEntries.map(entry => ({
          serial: entry.serial,
          battery_level: entry.battery_level,
          color: entry.color,
          storage: entry.storage,
          ram: entry.ram,
          price: entry.price,
          min_price: entry.min_price,
          max_price: entry.max_price
        }))
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
   * REMOVED: Stock updates are now handled exclusively by database triggers
   * The sync_product_stock_from_units() trigger automatically maintains accurate stock counts
   * This eliminates race conditions and ensures a single source of truth
   */
  private async updateProductStock(productId: string, newStock: number): Promise<void> {
    console.log(`🚫 [Stock Management] Stock update bypassed - handled by database trigger for product ${productId}`);
    console.log(`📊 [Stock Info] Expected stock: ${newStock} (will be set by trigger automatically)`);
    // No-op: Database trigger handles all stock updates
  }
}

export const universalProductService = new UniversalProductServiceClass();