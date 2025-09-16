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
    let products = await InventoryManagementService.getProducts({
      searchTerm: searchTerm || undefined
    });

    // If search term is exactly 4 digits, also search by IMEI last 4 digits
    if (searchTerm && /^\d{4}$/.test(searchTerm)) {
      const allProducts = await InventoryManagementService.getProducts({});
      const imeiMatches = allProducts.filter(product => 
        product.has_serial && product.product_units?.some(unit => 
          unit.status === 'available' && 
          (unit.serial_number?.endsWith(searchTerm) || unit.barcode?.endsWith(searchTerm))
        )
      );
      
      // Merge with regular search results, avoiding duplicates
      const existingIds = new Set(products.map(p => p.id));
      const newMatches = imeiMatches.filter(p => !existingIds.has(p.id));
      products = [...products, ...newMatches];
    }

    // Filter products to show only those with available stock or units
    return products.filter(product => {
      // For serialized products, check available units
      if (product.has_serial && product.product_units) {
        const availableUnits = product.product_units.filter(unit => unit.status === 'available');
        
        // If searching by 4 digits, filter units to show only matching ones
        if (searchTerm && /^\d{4}$/.test(searchTerm)) {
          const matchingUnits = availableUnits.filter(unit => 
            unit.serial_number?.endsWith(searchTerm) || unit.barcode?.endsWith(searchTerm)
          );
          return matchingUnits.length > 0;
        }
        
        return availableUnits.length > 0;
      }
      
      // For non-serialized products, check stock
      return product.stock > 0;
    }).map(product => ({
      ...product,
      // Only show available units, filtered by search if 4 digits
      product_units: product.product_units?.filter(unit => {
        if (unit.status !== 'available') return false;
        
        if (searchTerm && /^\d{4}$/.test(searchTerm)) {
          return unit.serial_number?.endsWith(searchTerm) || unit.barcode?.endsWith(searchTerm);
        }
        
        return true;
      }) || []
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