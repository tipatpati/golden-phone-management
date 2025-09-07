// ============================================
// INVENTORY MANAGEMENT SERVICE - REFACTORED
// ============================================
// Centralized service for all inventory operations with unified error handling

import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from "@/services/barcodes";
import { ThermalLabelDataService } from "@/services/labels/ThermalLabelDataService";
import { ProductUnitsService } from "./ProductUnitsService";
import type {
  Product,
  ProductUnit,
  ProductFormData,
  ProductWithUnits,
  CreateProductData,
  CreateProductUnitData,
  InventoryOperationResult,
  UnitEntryForm,
  LabelData,
  LabelGenerationOptions,
  InventorySearchFilters,
  BulkOperationResult,
  BulkUpdateRequest,
  BulkDeleteRequest,
  Category
} from "./types";
import { InventoryError, handleInventoryError } from "./errors";
import type { Tables } from "@/integrations/supabase/types";

type ProductHistoryRow = Tables<'product_history'>;
type ProductUnitHistoryRow = Tables<'product_unit_history'>;

/**
 * Centralized Inventory Management Service
 * Single source of truth for all inventory operations
 * Orchestrates product, unit, barcode, and label operations
 */
export class InventoryManagementService {
  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get all products with optional filtering including serial number search
   */
  static async getProducts(filters?: InventorySearchFilters): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_units(id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.trim();
        
        // If search term is 4 digits, search in serial numbers (last 4 digits)
        if (/^\d{4}$/.test(searchTerm)) {
          // Search for products that have units with serial numbers ending with these 4 digits
          const { data: unitsData } = await supabase
            .from('product_units')
            .select('product_id')
            .ilike('serial_number', `%${searchTerm}`);
          
          if (unitsData && unitsData.length > 0) {
            const productIds = [...new Set(unitsData.map(u => u.product_id))];
            query = query.in('id', productIds);
          } else {
            // Also search in regular fields as fallback
            query = query.or(`brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
          }
        } else {
          // Regular search in brand, model, barcode, and also check if it matches a serial number
          const searchConditions = [
            `brand.ilike.%${searchTerm}%`,
            `model.ilike.%${searchTerm}%`,
            `barcode.ilike.%${searchTerm}%`
          ];
          
          // Also search for products that have units with matching serial numbers
          const { data: unitsData } = await supabase
            .from('product_units')
            .select('product_id')
            .ilike('serial_number', `%${searchTerm}%`);
          
          if (unitsData && unitsData.length > 0) {
            const productIds = [...new Set(unitsData.map(u => u.product_id))];
            query = query.or([...searchConditions, `id.in.(${productIds.join(',')})`].join(','));
          } else {
            query = query.or(searchConditions.join(','));
          }
        }
      }
      
      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      
      if (filters?.stockStatus) {
        switch (filters.stockStatus) {
          case 'out_of_stock':
            query = query.eq('stock', 0);
            break;
          case 'low_stock':
            query = query.gt('stock', 0).lte('stock', 'threshold');
            break;
          case 'in_stock':
            query = query.gt('stock', 'threshold');
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        throw InventoryError.createDatabaseError('getProducts', error);
      }

      return (data || []).map(this.transformProduct);
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw InventoryError.createDatabaseError('getCategories', error);
      }

      return data || [];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get product units for a specific product
   */
  static async getProductUnits(productId: string): Promise<ProductUnit[]> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        throw InventoryError.createDatabaseError('getProductUnits', error, { productId });
      }

      return (data || []).map(unit => ({
        ...unit,
        status: unit.status as 'available' | 'sold' | 'reserved' | 'damaged'
      })) as ProductUnit[];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  /**
   * Create a new product with optional units
   */
  static async createProduct(formData: ProductFormData): Promise<InventoryOperationResult> {
    console.log('🎯 InventoryManagementService: Creating product:', formData.brand, formData.model);
    
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      // Validate form data
      const validation = this.validateProductForm(formData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Transform form data to database format
      const productData = this.transformFormToProductData(formData);

      // Create the product
      const { data: product, error } = await supabase
        .from('products')
        .insert(productData as any)
        .select(`
          *,
          category:categories(id, name)
        `)
        .single();

      if (error) {
        throw InventoryError.createDatabaseError('createProduct', error);
      }

      result.data = this.transformProduct(product);

      // Create units if product has serial numbers
      if (formData.has_serial && formData.unit_entries && formData.unit_entries.length > 0) {
        console.log('📦 Creating product units:', formData.unit_entries.length);
        
        const defaultPricing = {
          price: formData.price,
          min_price: formData.min_price,
          max_price: formData.max_price
        };

        try {
          const units = await ProductUnitsService.createUnitsForProduct(
            product.id,
            formData.unit_entries,
            defaultPricing
          );
          
          result.data.units = units;
          result.data.unitCount = units.length;
          console.log(`✅ Created ${units.length} units for product`);
        } catch (unitsError) {
          console.error('❌ Failed to create some units:', unitsError);
          result.warnings.push(`Some units failed to create: ${unitsError.message}`);
        }
      }

      result.success = true;
      console.log('✅ Product created successfully:', result.data.id);
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
      console.error('❌ Failed to create product:', inventoryError);
    }

    return result;
  }

  /**
   * Update an existing product
   */
  static async updateProduct(productId: string, formData: Partial<ProductFormData>): Promise<InventoryOperationResult> {
    console.log('🔄 InventoryManagementService: Updating product:', productId);
    
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
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
        throw InventoryError.createDatabaseError('updateProduct', error, { productId });
      }

      result.data = this.transformProduct(product);

      // Update units if provided
      if (formData.unit_entries) {
        try {
          await this.updateProductUnits(productId, formData.unit_entries);
          console.log('✅ Updated product units');
        } catch (unitsError) {
          console.error('❌ Failed to update some units:', unitsError);
          result.warnings.push(`Some units failed to update: ${unitsError.message}`);
        }
      }

      result.success = true;
      console.log('✅ Product updated successfully:', productId);
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
      console.error('❌ Failed to update product:', inventoryError);
    }

    return result;
  }

  /**
   * Delete a product and all its units
   */
  static async deleteProduct(productId: string): Promise<InventoryOperationResult> {
    console.log('🗑️ InventoryManagementService: Deleting product:', productId);
    
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      // First delete all units
      const { error: unitsError } = await supabase
        .from('product_units')
        .delete()
        .eq('product_id', productId);

      if (unitsError) {
        throw InventoryError.createDatabaseError('deleteProductUnits', unitsError, { productId });
      }

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) {
        throw InventoryError.createDatabaseError('deleteProduct', productError, { productId });
      }

      result.success = true;
      console.log('✅ Product deleted successfully:', productId);
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
      console.error('❌ Failed to delete product:', inventoryError);
    }

    return result;
  }

  // ============================================
  // UNIT OPERATIONS
  // ============================================

  /**
   * Create product units for a product
   */
  static async createProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    defaultPricing?: { price?: number; min_price?: number; max_price?: number }
  ): Promise<InventoryOperationResult> {
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      const units = await ProductUnitsService.createUnitsForProduct(productId, unitEntries, defaultPricing);
      result.data = units;
      result.success = true;
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
    }

    return result;
  }

  /**
   * Update product units
   */
  static async updateProductUnits(productId: string, unitEntries: UnitEntryForm[]): Promise<InventoryOperationResult> {
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      // Get existing units
      const existingUnits = await ProductUnitsService.getUnitsForProduct(productId);
      
      // Delete units not in the new entries
      const newSerials = unitEntries.map(e => e.serial);
      const unitsToDelete = existingUnits.filter(unit => !newSerials.includes(unit.serial_number));
      
      for (const unit of unitsToDelete) {
        await ProductUnitsService.deleteUnit(unit.id);
      }

      // Create new units
      const existingSerials = existingUnits.map(u => u.serial_number);
      const newEntries = unitEntries.filter(e => !existingSerials.includes(e.serial));
      
      if (newEntries.length > 0) {
        await ProductUnitsService.createUnitsForProduct(productId, newEntries);
      }

      result.success = true;
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
    }

    return result;
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(request: BulkUpdateRequest): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    try {
      for (const productId of request.productIds) {
        try {
          await this.updateProduct(productId, request.updates);
          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Product ${productId}: ${error.message}`);
        }
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Bulk delete products
   */
  static async bulkDeleteProducts(request: BulkDeleteRequest): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    try {
      for (const productId of request.productIds) {
        try {
          await this.deleteProduct(productId);
          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Product ${productId}: ${error.message}`);
        }
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  // ============================================
  // BARCODE OPERATIONS
  // ============================================

  /**
   * Generate barcode for a product unit
   */
  static async generateUnitBarcode(unitId: string): Promise<InventoryOperationResult> {
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      const barcode = await Code128GeneratorService.generateUnitBarcode(unitId);
      result.data = barcode;
      result.success = true;
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
    }

    return result;
  }

  // ============================================
  // LABEL OPERATIONS
  // ============================================

  /**
   * Generate thermal labels for products
   */
  static async generateLabels(
    products: Product[],
    options?: { useMasterBarcode?: boolean }
  ): Promise<InventoryOperationResult> {
    const result: InventoryOperationResult = {
      success: false,
      data: null,
      errors: [],
      warnings: []
    };

    try {
      const labelResult = await ThermalLabelDataService.generateLabelsForProducts(products, options);
      result.data = labelResult.labels;
      result.success = labelResult.success;
      result.errors = labelResult.errors;
      result.warnings = labelResult.warnings;
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      result.errors.push(inventoryError.message);
    }

    return result;
  }

  // ============================================
  // HISTORY OPERATIONS
  // ============================================

  // History methods

  /**
   * Get product-level history entries (INSERT/UPDATE/DELETE snapshots)
   */
  static async getProductHistory(productId: string, limit: number = 100): Promise<ProductHistoryRow[]> {
    try {
      const { data, error } = await supabase
        .from('product_history')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw InventoryError.createDatabaseError('getProductHistory', error, { productId });
      }

      return data || [];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get product unit-level history entries (INSERT/UPDATE/DELETE snapshots)
   */
  static async getProductUnitHistory(productUnitId: string, limit: number = 100): Promise<ProductUnitHistoryRow[]> {
    try {
      const { data, error } = await supabase
        .from('product_unit_history')
        .select('*')
        .eq('product_unit_id', productUnitId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw InventoryError.createDatabaseError('getProductUnitHistory', error, { productUnitId });
      }

      return data || [];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Transform form data to database product data
   */
  private static transformFormToProductData(formData: Partial<ProductFormData>): Partial<CreateProductData> {
    const { unit_entries, ...productData } = formData;
    return {
      ...productData,
      serial_numbers: formData.has_serial ? formData.serial_numbers : undefined
    };
  }

  /**
   * Get a product with its units
   */
  static async getProductWithUnits(productId: string): Promise<ProductWithUnits | null> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw InventoryError.createDatabaseError('getProductWithUnits', error, { productId });
      }

      const transformedProduct = this.transformProduct(product);
      
      // Get units if product has serial numbers
      if (product.has_serial) {
        const units = await this.getProductUnits(productId);
        return {
          ...transformedProduct,
          units,
          unitCount: units.length,
          availableUnits: units.filter(u => u.status === 'available').length
        };
      }

      return transformedProduct;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Validate product form data
   */
  static validateProductForm(formData: Partial<ProductFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.brand?.trim()) {
      errors.push('Brand is required');
    }

    if (!formData.model?.trim()) {
      errors.push('Model is required');
    }

    if (!formData.category_id || formData.category_id < 1 || formData.category_id > 4) {
      errors.push('Valid category is required');
    }

    if (formData.threshold === undefined || formData.threshold < 0) {
      errors.push('Threshold must be 0 or greater');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform raw product data from database
   */
  private static transformProduct(product: any): Product {
    return {
      ...product,
      category_name: product.category?.name,
    };
  }
}