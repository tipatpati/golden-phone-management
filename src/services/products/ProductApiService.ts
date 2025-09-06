// ============================================
// DEPRECATED - Use InventoryManagementService instead
// ============================================
// This service is kept for backward compatibility only.
// All new code should use InventoryManagementService.

import { InventoryManagementService } from '../inventory/InventoryManagementService';
import type { Product, CreateProductData } from '../inventory/types';

/**
 * @deprecated Use InventoryManagementService instead
 */
export class ProductApiService {
  constructor() {
    console.warn('⚠️ ProductApiService is deprecated. Use InventoryManagementService instead.');
  }

  async getAll(filters = {}): Promise<Product[]> {
    console.warn('⚠️ ProductApiService.getAll is deprecated. Use InventoryManagementService.getProducts instead.');
    return InventoryManagementService.getProducts(filters);
  }

  async getById(id: string): Promise<Product> {
    console.warn('⚠️ ProductApiService.getById is deprecated. Use InventoryManagementService.getProductWithUnits instead.');
    const product = await InventoryManagementService.getProductWithUnits(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async create(productData: CreateProductData): Promise<Product> {
    console.warn('⚠️ ProductApiService.create is deprecated. Use InventoryManagementService.createProduct instead.');
    const result = await InventoryManagementService.createProduct(productData as any);
    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
    return result.data;
  }

  async update(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    console.warn('⚠️ ProductApiService.update is deprecated. Use InventoryManagementService.updateProduct instead.');
    const result = await InventoryManagementService.updateProduct(id, productData);
    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
    return result.data;
  }

  async search(searchTerm: string): Promise<Product[]> {
    console.warn('⚠️ ProductApiService.search is deprecated. Use InventoryManagementService.getProducts with filters instead.');
    return InventoryManagementService.getProducts({ searchTerm });
  }

  async getCategories() {
    console.warn('⚠️ ProductApiService.getCategories is deprecated. Use InventoryManagementService.getCategories instead.');
    return InventoryManagementService.getCategories();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    console.warn('⚠️ ProductApiService.bulkDelete is deprecated. Use InventoryManagementService.bulkDeleteProducts instead.');
    const result = await InventoryManagementService.bulkDeleteProducts({ productIds: ids });
    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
  }

  async bulkUpdate(updates: Array<{ id: string; [key: string]: any }>): Promise<void> {
    console.warn('⚠️ ProductApiService.bulkUpdate is deprecated. Use InventoryManagementService.bulkUpdateProducts instead.');
    
    // Group updates by their update data (assuming all updates have the same shape)
    if (updates.length === 0) return;
    
    const { id, ...updateData } = updates[0];
    const productIds = updates.map(u => u.id);
    
    const result = await InventoryManagementService.bulkUpdateProducts({
      productIds,
      updates: updateData
    });
    
    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
  }
}