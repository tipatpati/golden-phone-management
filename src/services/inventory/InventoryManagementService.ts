// ============================================
// INVENTORY MANAGEMENT SERVICE - REFACTORED
// ============================================
// Centralized service for all inventory operations with unified error handling

import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from "@/services/barcodes";
import { ThermalLabelDataService } from "@/services/labels/ThermalLabelDataService";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
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
          units:product_units(id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price)
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
   * Create a new product with optional units using unified service
   */
  static async createProduct(formData: ProductFormData): Promise<InventoryOperationResult> {
    console.log('🎯 InventoryManagementService: Delegating to unified service:', formData.brand, formData.model);
    
    try {
      // Use unified product creation service
      const { unifiedProductCreationService } = await import('@/services/shared/UnifiedProductCreationService');
      
      const unifiedResult = await unifiedProductCreationService.createProduct(formData, {
        source: 'inventory'
      });

      // Transform unified result to inventory operation result
      const result: InventoryOperationResult = {
        success: unifiedResult.success,
        data: unifiedResult.product ? {
          ...unifiedResult.product,
          units: unifiedResult.units,
          unitCount: unifiedResult.createdUnitCount
        } : null,
        errors: unifiedResult.errors,
        warnings: unifiedResult.warnings
      };

      if (unifiedResult.success) {
        console.log('✅ Product created via unified service:', result.data?.id);
      } else {
        console.error('❌ Unified product creation failed:', result.errors);
      }

      return result;
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      return {
        success: false,
        data: null,
        errors: [inventoryError.message],
        warnings: []
      };
    }
  }

  /**
   * Update an existing product using unified service
   */
  static async updateProduct(productId: string, formData: Partial<ProductFormData>): Promise<InventoryOperationResult> {
    console.log('🔄 InventoryManagementService: Delegating update to unified service:', productId);
    
    try {
      // Use unified product creation service
      const { unifiedProductCreationService } = await import('@/services/shared/UnifiedProductCreationService');
      
      const unifiedResult = await unifiedProductCreationService.updateProduct(productId, formData, {
        source: 'inventory'
      });

      // Transform unified result to inventory operation result
      const result: InventoryOperationResult = {
        success: unifiedResult.success,
        data: unifiedResult.product ? {
          ...unifiedResult.product,
          units: unifiedResult.units,
          unitCount: unifiedResult.createdUnitCount
        } : null,
        errors: unifiedResult.errors,
        warnings: unifiedResult.warnings
      };

      if (unifiedResult.success) {
        console.log('✅ Product updated via unified service:', productId);
      } else {
        console.error('❌ Unified product update failed:', result.errors);
      }

      return result;
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      return {
        success: false,
        data: null,
        errors: [inventoryError.message],
        warnings: []
      };
    }
  }

  /**
   * Delete a product and all its units using unified service
   */
  static async deleteProduct(productId: string): Promise<InventoryOperationResult> {
    console.log('🗑️ InventoryManagementService: Delegating deletion to unified service:', productId);
    
    try {
      // Use unified product creation service
      const { unifiedProductCreationService } = await import('@/services/shared/UnifiedProductCreationService');
      
      const deleteResult = await unifiedProductCreationService.deleteProduct(productId, {
        source: 'inventory'
      });

      const result: InventoryOperationResult = {
        success: deleteResult.success,
        data: null,
        errors: deleteResult.errors,
        warnings: []
      };

      if (deleteResult.success) {
        console.log('✅ Product deleted via unified service:', productId);
      } else {
        console.error('❌ Unified product deletion failed:', result.errors);
      }

      return result;
      
    } catch (error) {
      const inventoryError = handleInventoryError(error);
      return {
        success: false,
        data: null,
        errors: [inventoryError.message],
        warnings: []
      };
    }
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
      const unitResult = await ProductUnitManagementService.createUnitsForProduct({
        productId,
        unitEntries,
        defaultPricing
      });
      result.data = unitResult.units;
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
      
      if (newEntries.length > 0) {
        await ProductUnitManagementService.createUnitsForProduct({
          productId,
          unitEntries: newEntries
        });
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
          category:categories(id, name),
          units:product_units(id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw InventoryError.createDatabaseError('getProductWithUnits', error, { productId });
      }

      const transformedProduct = this.transformProduct(product);
      
      // Process units data (already included in query via "units" alias)
      if (product.has_serial && product.units) {
        console.log('🔍 ProductWithUnits: Processing units from database:', product.units.length);
        // Transform units to include missing product_id
        const units = product.units.map((unit: any) => ({
          ...unit,
          product_id: productId,
          status: unit.status as 'available' | 'sold' | 'reserved' | 'damaged'
        })) as ProductUnit[];
        
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