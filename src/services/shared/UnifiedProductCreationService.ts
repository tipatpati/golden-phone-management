/**
 * Unified Product Creation Service
 * Single source of truth for product creation across all modules
 * Ensures consistency between inventory and supplier operations
 */

import { supabase } from "@/integrations/supabase/client";
import { UnifiedProductCoordinator } from "./UnifiedProductCoordinator";
import { ProductUnitManagementService } from "./ProductUnitManagementService";
import type { 
  ProductFormData, 
  UnitEntryForm, 
  InventoryOperationResult,
  Product 
} from "@/services/inventory/types";

export interface UnifiedProductCreationOptions {
  source: 'inventory' | 'supplier';
  transactionId?: string;
  supplierId?: string;
  unitCost?: number;
  metadata?: Record<string, any>;
}

export interface UnifiedProductCreationResult {
  success: boolean;
  product: Product | null;
  units: any[];
  errors: string[];
  warnings: string[];
  isExistingProduct: boolean;
  createdUnitCount: number;
}

class UnifiedProductCreationServiceClass {
  /**
   * Unified product creation method used by both inventory and supplier modules
   */
  async createProduct(
    formData: ProductFormData,
    options: UnifiedProductCreationOptions
  ): Promise<UnifiedProductCreationResult> {
    console.log(`🎯 UnifiedProductCreation: Creating product from ${options.source}:`, formData.brand, formData.model);
    
    const result: UnifiedProductCreationResult = {
      success: false,
      product: null,
      units: [],
      errors: [],
      warnings: [],
      isExistingProduct: false,
      createdUnitCount: 0
    };

    try {
      // Step 1: Validate form data
      const validation = this.validateProductForm(formData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Step 2: Use unified product resolution to check for existing products
      const { product, isExisting } = await UnifiedProductCoordinator.resolveProduct(
        formData.brand,
        formData.model,
        {
          ...formData,
          price: options.unitCost || formData.price,
          has_serial: formData.has_serial || (formData.unit_entries && formData.unit_entries.length > 0)
        }
      );

      result.product = this.transformProduct(product);
      result.isExistingProduct = isExisting;

      // Step 3: Notify about product action
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
          ...options.metadata
        }
      });

      // Step 4: Create units if product has serial numbers and no units exist yet
      if (formData.has_serial && formData.unit_entries && formData.unit_entries.length > 0) {
        // Check if units already exist for this product to avoid duplication
        const existingUnits = await ProductUnitManagementService.getUnitsForProduct(product.id);
        const existingSerials = new Set(existingUnits.map(u => u.serial_number));
        const newEntries = formData.unit_entries.filter(e => !existingSerials.has(e.serial));
        
        if (newEntries.length > 0) {
          console.log(`📦 Creating ${newEntries.length} new units (${existingUnits.length} already exist)`);
          
          const defaultPricing = {
            price: options.unitCost || formData.price,
            min_price: formData.min_price,
            max_price: formData.max_price
          };

          try {
            const unitResults = await this.createProductUnits(
              product.id,
              newEntries,
              defaultPricing,
              options
            );
            
            // Combine existing and new units
            result.units = [...existingUnits, ...unitResults.units];
            result.createdUnitCount = unitResults.units.length;
            
            console.log(`✅ Created ${result.createdUnitCount} new units, total: ${result.units.length}`);
          } catch (unitsError) {
            console.error('❌ Failed to create some units:', unitsError);
            result.warnings.push(`Some units failed to create: ${unitsError.message}`);
          }
        } else {
          console.log(`✅ All ${formData.unit_entries.length} units already exist, skipping creation`);
          result.units = existingUnits;
          result.createdUnitCount = 0;
        }
      }

      result.success = true;
      console.log('✅ Unified product creation successful:', result.product.id);
      
    } catch (error) {
      console.error('❌ Unified product creation failed:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Create product units with unified coordination
   */
  private async createProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    defaultPricing: { price?: number; min_price?: number; max_price?: number },
    options: UnifiedProductCreationOptions
  ): Promise<{ units: any[] }> {
    const createdUnits: any[] = [];

    for (const unitEntry of unitEntries) {
      try {
        // Use unified unit resolution
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

        createdUnits.push(unit);

        // Notify about unit action
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
        throw error;
      }
    }

    return { units: createdUnits };
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
    if (formData.min_price && formData.min_price >= formData.price) {
      errors.push('Minimum price must be less than base price');
    }
    if (formData.max_price && formData.max_price <= formData.price) {
      errors.push('Maximum price must be greater than base price');
    }
    if (formData.threshold < 0) {
      errors.push('Stock threshold cannot be negative');
    }

    // Serial number validation
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
   * Update an existing product using unified coordination
   */
  async updateProduct(
    productId: string,
    formData: Partial<ProductFormData>,
    options: UnifiedProductCreationOptions
  ): Promise<UnifiedProductCreationResult> {
    console.log(`🔄 UnifiedProductCreation: Updating product from ${options.source}:`, productId);
    
    const result: UnifiedProductCreationResult = {
      success: false,
      product: null,
      units: [],
      errors: [],
      warnings: [],
      isExistingProduct: true,
      createdUnitCount: 0
    };

    try {
      // Transform form data to database format
      const productData = this.transformFormToProductData(formData);

      // Update the product
      const { data: product, error } = await supabase
        .from('products')
        .update(productData as any)
        .eq('id', productId)
        .select(`
          *,
          category:categories(id, name)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update product: ${error.message}`);
      }

      result.product = this.transformProduct(product);

      // Notify about product update
      UnifiedProductCoordinator.notifyEvent({
        type: 'product_updated',
        source: options.source,
        entityId: productId,
        metadata: {
          source: options.source,
          transactionId: options.transactionId,
          ...options.metadata
        }
      });

      // Update units if provided
      if (formData.unit_entries) {
        try {
          const unitResults = await this.updateProductUnits(productId, formData.unit_entries, options);
          result.units = unitResults.units;
          result.createdUnitCount = unitResults.newUnitsCount;
          console.log('✅ Updated product units');
        } catch (unitsError) {
          console.error('❌ Failed to update some units:', unitsError);
          result.warnings.push(`Some units failed to update: ${unitsError.message}`);
        }
      }

      result.success = true;
      console.log('✅ Product updated successfully:', productId);
      
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Update product units with unified coordination
   */
  private async updateProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    options: UnifiedProductCreationOptions
  ): Promise<{ units: any[]; newUnitsCount: number }> {
    // Get existing units
    const existingUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
    
    // Delete units not in the new entries
    const newSerials = unitEntries.map(e => e.serial);
    const unitsToDelete = existingUnits.filter(unit => !newSerials.includes(unit.serial_number));
    
    for (const unit of unitsToDelete) {
      await ProductUnitManagementService.updateUnitStatus(unit.id, 'damaged'); // Mark as deleted
    }

    // Create new units
    const existingSerials = existingUnits.map(u => u.serial_number);
    const newEntries = unitEntries.filter(e => !existingSerials.includes(e.serial));
    
    let newUnitsCount = 0;
    const allUnits: any[] = [];

    if (newEntries.length > 0) {
      const createResult = await this.createProductUnits(
        productId,
        newEntries,
        { price: 0 }, // Will be set from individual entries
        options
      );
      allUnits.push(...createResult.units);
      newUnitsCount = createResult.units.length;
    }

    // Add existing units that remain
    const remainingUnits = existingUnits.filter(unit => newSerials.includes(unit.serial_number));
    allUnits.push(...remainingUnits);

    return { units: allUnits, newUnitsCount };
  }

  /**
   * Transform form data to database format
   */
  private transformFormToProductData(formData: Partial<ProductFormData>): Record<string, any> {
    const productData: Record<string, any> = {};

    // Map form fields to database columns
    if (formData.brand !== undefined) productData.brand = formData.brand;
    if (formData.model !== undefined) productData.model = formData.model;
    if (formData.price !== undefined) productData.price = formData.price;
    if (formData.min_price !== undefined) productData.min_price = formData.min_price;
    if (formData.max_price !== undefined) productData.max_price = formData.max_price;
    if (formData.stock !== undefined) productData.stock = formData.stock;
    if (formData.threshold !== undefined) productData.threshold = formData.threshold;
    if (formData.has_serial !== undefined) productData.has_serial = formData.has_serial;
    if (formData.category_id !== undefined) productData.category_id = formData.category_id;
    if (formData.barcode !== undefined) productData.barcode = formData.barcode;
    if (formData.description !== undefined) productData.description = formData.description;
    if (formData.supplier !== undefined) productData.supplier = formData.supplier;
    if (formData.year !== undefined) productData.year = formData.year;
    if (formData.serial_numbers !== undefined) productData.serial_numbers = formData.serial_numbers;

    // Always update the updated_at timestamp
    productData.updated_at = new Date().toISOString();

    return productData;
  }

  /**
   * Delete a product and all its units with unified coordination
   */
  async deleteProduct(
    productId: string,
    options: UnifiedProductCreationOptions
  ): Promise<{ success: boolean; errors: string[] }> {
    console.log(`🗑️ UnifiedProductCreation: Deleting product from ${options.source}:`, productId);
    
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

      console.log('✅ Product deleted successfully:', productId);
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      return { success: false, errors: [error.message] };
    }
  }
}

export const unifiedProductCreationService = new UnifiedProductCreationServiceClass();