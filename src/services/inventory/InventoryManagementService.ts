import { supabase } from "@/integrations/supabase/client";
import { ProductUnitsService } from "../products/ProductUnitsService";
import { Code128GeneratorService } from "../barcodes/Code128GeneratorService";
import { ThermalLabelDataService } from "../labels/ThermalLabelDataService";
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
  LabelGenerationOptions
} from "./types";

/**
 * Centralized Inventory Management Service
 * Single source of truth for all inventory operations
 * Orchestrates product, unit, barcode, and label operations
 */
export class InventoryManagementService {
  
  // =================== PRODUCT OPERATIONS ===================
  
  /**
   * Create a new product with optional units
   * Handles the complete product creation workflow
   */
  static async createProduct(formData: ProductFormData): Promise<InventoryOperationResult> {
    console.log('🏭 InventoryManagementService: Creating product', { brand: formData.brand, model: formData.model });
    
    try {
      // 1. Transform form data to database format (remove form-only fields)
      const productData = this.transformFormToProductData(formData);
      
      // 2. Create the product record
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData as any)
        .select(`
          *,
          category:categories(id, name)
        `)
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      let units: ProductUnit[] = [];
      const warnings: string[] = [];

      // 3. Create units if product has serials
      if (formData.has_serial && formData.unit_entries?.length > 0) {
        const unitResult = await this.createProductUnits(
          product.id,
          formData.unit_entries,
          {
            price: formData.price,
            min_price: formData.min_price,
            max_price: formData.max_price
          }
        );
        
        if (!unitResult.success) {
          warnings.push(`Product created but some units failed: ${unitResult.errors.join(', ')}`);
        } else {
          units = unitResult.data || [];
        }
      }

      // 4. Update product stock based on created units
      if (formData.has_serial && units.length > 0) {
        await supabase
          .from('products')
          .update({ stock: units.length })
          .eq('id', product.id);
      }

      console.log('✅ InventoryManagementService: Product created successfully', { 
        productId: product.id, 
        unitsCount: units.length 
      });

      return {
        success: true,
        data: { 
          product: { ...product, category_name: product.category?.name },
          units,
          unitCount: units.length
        },
        errors: [],
        warnings
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Product creation failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      };
    }
  }

  /**
   * Update an existing product and its units
   */
  static async updateProduct(
    productId: string, 
    formData: Partial<ProductFormData>
  ): Promise<InventoryOperationResult> {
    console.log('🔄 InventoryManagementService: Updating product', { productId });
    
    try {
      // 1. Transform form data to database format
      const productData = this.transformFormToProductData(formData);
      
      // 2. Update the product record
      const { data: product, error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select(`
          *,
          category:categories(id, name)
        `)
        .single();

      if (productError) {
        throw new Error(`Failed to update product: ${productError.message}`);
      }

      let units: ProductUnit[] = [];
      const warnings: string[] = [];

      // 3. Handle unit updates if needed
      if (formData.has_serial && formData.unit_entries) {
        const unitResult = await this.updateProductUnits(productId, formData.unit_entries);
        
        if (!unitResult.success) {
          warnings.push(`Product updated but unit updates failed: ${unitResult.errors.join(', ')}`);
        } else {
          units = unitResult.data || [];
        }
      }

      console.log('✅ InventoryManagementService: Product updated successfully', { productId });

      return {
        success: true,
        data: { 
          product: { ...product, category_name: product.category?.name },
          units
        },
        errors: [],
        warnings
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Product update failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      };
    }
  }

  /**
   * Delete a product and all its units
   */
  static async deleteProduct(productId: string): Promise<InventoryOperationResult> {
    console.log('🗑️ InventoryManagementService: Deleting product', { productId });
    
    try {
      // 1. Delete all product units first (cascade)
      await supabase
        .from('product_units')
        .delete()
        .eq('product_id', productId);

      // 2. Delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }

      console.log('✅ InventoryManagementService: Product deleted successfully', { productId });

      return {
        success: true,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Product deletion failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      };
    }
  }

  // =================== UNIT OPERATIONS ===================
  
  /**
   * Create product units with barcodes
   */
  static async createProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[],
    defaultPricing?: { price?: number; min_price?: number; max_price?: number }
  ): Promise<InventoryOperationResult> {
    console.log('🏷️ InventoryManagementService: Creating product units', { 
      productId, 
      count: unitEntries.length 
    });

    try {
      const units = await ProductUnitsService.createUnitsForProduct(
        productId,
        unitEntries,
        defaultPricing
      );

      return {
        success: true,
        data: units,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Unit creation failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to create product units'],
        warnings: []
      };
    }
  }

  /**
   * Update product units (replace existing with new ones)
   */
  static async updateProductUnits(
    productId: string,
    unitEntries: UnitEntryForm[]
  ): Promise<InventoryOperationResult> {
    console.log('🔄 InventoryManagementService: Updating product units', { 
      productId, 
      newCount: unitEntries.length 
    });

    try {
      // 1. Get existing units
      const existingUnits = await ProductUnitsService.getUnitsForProduct(productId);
      
      // 2. Delete existing units that are not in the new list
      const newSerials = new Set(unitEntries.map(entry => entry.serial));
      const unitsToDelete = existingUnits.filter(unit => !newSerials.has(unit.serial_number));
      
      for (const unit of unitsToDelete) {
        await ProductUnitsService.deleteUnit(unit.id);
      }

      // 3. Create or update units
      const existingSerials = new Set(existingUnits.map(unit => unit.serial_number));
      const entriesToCreate = unitEntries.filter(entry => !existingSerials.has(entry.serial));
      
      let allUnits = existingUnits.filter(unit => newSerials.has(unit.serial_number));
      
      if (entriesToCreate.length > 0) {
        const newUnits = await ProductUnitsService.createUnitsForProduct(
          productId,
          entriesToCreate
        );
        allUnits.push(...newUnits);
      }

      return {
        success: true,
        data: allUnits,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Unit update failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to update product units'],
        warnings: []
      };
    }
  }

  // =================== BARCODE OPERATIONS ===================
  
  /**
   * Generate or update barcode for a product unit
   */
  static async generateUnitBarcode(unitId: string): Promise<InventoryOperationResult> {
    try {
      const barcode = await Code128GeneratorService.generateUnitBarcode(unitId);
      
      return {
        success: true,
        data: { barcode },
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Barcode generation failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to generate barcode'],
        warnings: []
      };
    }
  }

  // =================== LABEL OPERATIONS ===================
  
  /**
   * Generate thermal labels for products
   */
  static async generateLabels(
    products: Product[],
    options?: { useMasterBarcode?: boolean }
  ): Promise<InventoryOperationResult> {
    try {
      const result = await ThermalLabelDataService.generateLabelsForProducts(products, options);
      
      return {
        success: result.labels.length > 0,
        data: result,
        errors: result.errors,
        warnings: result.warnings
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Label generation failed', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to generate labels'],
        warnings: []
      };
    }
  }

  // =================== UTILITY METHODS ===================
  
  /**
   * Transform form data to database-compatible product data
   */
  private static transformFormToProductData(formData: Partial<ProductFormData>): Partial<CreateProductData> {
    const { unit_entries, ...productData } = formData as any;
    
    // Remove form-only fields and ensure proper types
    return {
      ...productData,
      stock: productData.stock || 0,
      threshold: productData.threshold || 5,
      price: productData.price || 0,
      min_price: productData.min_price || 0,
      max_price: productData.max_price || 0,
      has_serial: productData.has_serial || false
    };
  }

  /**
   * Get product with its units
   */
  static async getProductWithUnits(productId: string): Promise<ProductWithUnits | null> {
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

      if (productError || !product) {
        console.error('Product not found:', productError);
        return null;
      }

      // Get units if product has serials
      let units: ProductUnit[] = [];
      if (product.has_serial) {
        units = await ProductUnitsService.getUnitsForProduct(productId);
      }

      return {
        ...product,
        category_name: product.category?.name,
        units,
        unitCount: units.length,
        availableUnits: units.filter(unit => unit.status === 'available').length
      };

    } catch (error) {
      console.error('❌ InventoryManagementService: Failed to get product with units', error);
      return null;
    }
  }

  /**
   * Validate product form data
   */
  static validateProductForm(formData: Partial<ProductFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!formData.brand?.trim()) {
      errors.push('Brand is required');
    }
    if (!formData.model?.trim()) {
      errors.push('Model is required');
    }
    if (!formData.category_id) {
      errors.push('Category is required');
    }
    if (formData.threshold !== undefined && formData.threshold < 0) {
      errors.push('Threshold must be non-negative');
    }

    // Serial number validation
    if (formData.has_serial) {
      if (!formData.unit_entries || formData.unit_entries.length === 0) {
        errors.push('Products with serial numbers must have at least one unit entry');
      } else {
        // Check for duplicate serials
        const serials = formData.unit_entries.map(entry => entry.serial).filter(Boolean);
        const uniqueSerials = new Set(serials);
        if (serials.length !== uniqueSerials.size) {
          errors.push('Duplicate serial numbers are not allowed');
        }

        // Validate serial format (basic validation)
        for (const entry of formData.unit_entries) {
          if (entry.serial && entry.serial.length < 10) {
            errors.push(`Serial number "${entry.serial}" is too short (minimum 10 characters)`);
          }
        }
      }
    }

    // Price validation
    if (formData.min_price !== undefined && formData.max_price !== undefined) {
      if (formData.min_price >= formData.max_price) {
        errors.push('Minimum price must be less than maximum price');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}