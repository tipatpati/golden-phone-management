// Unit pricing utility functions
import { ProductUnitsService } from "@/services/inventory/ProductUnitsService";

export interface PricingInfo {
  display: string;
  type: 'unit-pricing' | 'single-price' | 'no-price';
  hasUnits: boolean;
  unitCount?: number;
  priceRange?: { min: number; max: number };
}

/**
 * Calculate pricing display information for a product
 */
export async function getProductPricingInfo(
  product: {
    id: string;
    price: number;
    has_serial: boolean;
    min_price?: number;
    max_price?: number;
  }
): Promise<PricingInfo> {
  // For products without serial tracking, use regular price
  if (!product.has_serial) {
    if (product.price > 0) {
      return {
        display: `€${product.price.toFixed(2)}`,
        type: 'single-price',
        hasUnits: false
      };
    } else {
      return {
        display: 'Prezzo non disponibile',
        type: 'no-price',
        hasUnits: false
      };
    }
  }

  // For products with serial tracking, check if they have units
  try {
    const units = await ProductUnitsService.getUnitsForProduct(product.id);
    
    if (units.length === 0) {
      // No units available
      if (product.price > 0) {
        return {
          display: `€${product.price.toFixed(2)}`,
          type: 'single-price',
          hasUnits: false
        };
      } else {
        return {
          display: 'Nessuna unità disponibile',
          type: 'no-price',
          hasUnits: false
        };
      }
    }

    // Calculate price range from actual units
    const availableUnits = units.filter(unit => unit.status === 'available');
    const prices = availableUnits
      .map(unit => unit.price)
      .filter(price => price != null && price > 0) as number[];

    if (prices.length === 0) {
      return {
        display: 'Prezzi unità non disponibili',
        type: 'unit-pricing',
        hasUnits: true,
        unitCount: availableUnits.length
      };
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return {
        display: `€${minPrice.toFixed(2)} (per unità)`,
        type: 'unit-pricing',
        hasUnits: true,
        unitCount: availableUnits.length,
        priceRange: { min: minPrice, max: maxPrice }
      };
    } else {
      return {
        display: `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`,
        type: 'unit-pricing',
        hasUnits: true,
        unitCount: availableUnits.length,
        priceRange: { min: minPrice, max: maxPrice }
      };
    }
  } catch (error) {
    console.error('Error fetching unit pricing info:', error);
    
    // Fallback to base product price or min/max if available
    if (product.min_price && product.max_price && product.min_price > 0) {
      if (product.min_price === product.max_price) {
        return {
          display: `€${product.min_price.toFixed(2)}`,
          type: 'unit-pricing',
          hasUnits: false
        };
      } else {
        return {
          display: `€${product.min_price.toFixed(2)} - €${product.max_price.toFixed(2)}`,
          type: 'unit-pricing',
          hasUnits: false,
          priceRange: { min: product.min_price, max: product.max_price }
        };
      }
    }
    
    if (product.price > 0) {
      return {
        display: `€${product.price.toFixed(2)}`,
        type: 'single-price',
        hasUnits: false
      };
    }

    return {
      display: 'Prezzo non disponibile',
      type: 'no-price',
      hasUnits: false
    };
  }
}

/**
 * Synchronous version that uses cached min/max pricing data
 */
export function getProductPricingInfoSync(product: {
  price: number;
  has_serial: boolean;
  min_price?: number;
  max_price?: number;
}): PricingInfo {
  // For products without serial tracking, use regular price
  if (!product.has_serial) {
    if (product.price > 0) {
      return {
        display: `€${product.price.toFixed(2)}`,
        type: 'single-price',
        hasUnits: false
      };
    } else {
      return {
        display: 'Prezzo non disponibile',
        type: 'no-price',
        hasUnits: false
      };
    }
  }

  // For products with serial tracking, use min/max if available
  if (product.min_price != null && product.max_price != null && product.min_price > 0) {
    if (product.min_price === product.max_price) {
      return {
        display: `€${product.min_price.toFixed(2)} (per unità)`,
        type: 'unit-pricing',
        hasUnits: true,
        priceRange: { min: product.min_price, max: product.max_price }
      };
    } else {
      return {
        display: `€${product.min_price.toFixed(2)} - €${product.max_price.toFixed(2)}`,
        type: 'unit-pricing',
        hasUnits: true,
        priceRange: { min: product.min_price, max: product.max_price }
      };
    }
  }

  // Fallback to base price
  if (product.price > 0) {
    return {
      display: `€${product.price.toFixed(2)}`,
      type: 'single-price',
      hasUnits: false
    };
  }

  return {
    display: 'Prezzi unità individuali',
    type: 'unit-pricing',
    hasUnits: false
  };
}