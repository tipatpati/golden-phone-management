import { InventoryManagementService } from '../inventory/InventoryManagementService';
import type { Product } from '../inventory/types';

/**
 * Sales-specific product service
 * Optimized for sales operations with unit-level tracking
 */
export class SalesProductService {
  /**
   * Get products optimized for sales with available units only
   */
  static async getProductsForSales(searchTerm?: string): Promise<Product[]> {
    const products = await InventoryManagementService.getProducts({
      searchTerm: searchTerm || undefined
    });

    // Filter products to show only those with available stock or units
    return products.filter(product => {
      // For serialized products, check available units
      if (product.has_serial && product.product_units) {
        return product.product_units.some(unit => unit.status === 'available');
      }
      
      // For non-serialized products, check stock
      return product.stock > 0;
    }).map(product => ({
      ...product,
      // Only show available units
      product_units: product.product_units?.filter(unit => unit.status === 'available') || []
    }));
  }

  /**
   * Search for specific product by barcode or serial number
   */
  static async searchByCode(code: string): Promise<Product | null> {
    // First try to find by product barcode
    const products = await InventoryManagementService.getProducts({
      searchTerm: code
    });

    // Check if any product matches exactly by barcode
    let matchedProduct = products.find(p => p.barcode === code);
    
    if (matchedProduct) {
      return matchedProduct;
    }

    // Then search by unit barcode or serial number
    for (const product of products) {
      if (product.product_units) {
        const matchedUnit = product.product_units.find(unit => 
          unit.barcode === code || unit.serial_number === code ||
          (code.length === 4 && unit.serial_number.endsWith(code))
        );
        
        if (matchedUnit && matchedUnit.status === 'available') {
          return {
            ...product,
            product_units: [matchedUnit] // Return only the matched unit
          };
        }
      }
    }

    return null;
  }
}