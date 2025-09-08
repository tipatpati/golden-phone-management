import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { eventBus, EVENT_TYPES } from './EventBus';
import { transactionCoordinator } from './TransactionCoordinator';
import type { Product } from '../inventory/types';

/**
 * Advanced inventory-client integration for personalized experiences
 */
export class AdvancedInventoryClientIntegration {
  
  /**
   * Get personalized product recommendations for a client
   */
  static async getPersonalizedRecommendations(
    clientId: string,
    options: {
      limit?: number;
      categories?: string[];
      priceRange?: { min: number; max: number };
      excludeOwned?: boolean;
    } = {}
  ): Promise<Array<{
    product: Product;
    score: number;
    reason: string;
    availability: {
      inStock: boolean;
      quantity: number;
      reservations?: number;
    };
  }>> {
    try {
      const { limit = 10, categories, priceRange, excludeOwned = true } = options;

      // Get client's purchase history
      const purchaseHistory = await this.getClientPurchaseHistory(clientId);
      
      // Get all available products
      let query = supabase
        .from('products')
        .select(`
          *,
          product_units (
            id,
            status,
            serial_number
          )
        `);

      // Apply filters
      if (categories && categories.length > 0) {
        // Convert category names to IDs if needed, or filter by category IDs
        const categoryIds = categories.map(cat => typeof cat === 'string' ? parseInt(cat) : cat);
        query = query.in('category_id', categoryIds);
      }

      if (priceRange) {
        query = query.gte('price', priceRange.min).lte('price', priceRange.max);
      }

      const { data: products, error } = await query;
      if (error) throw error;

      const recommendations: Array<{
        product: Product;
        score: number;
        reason: string;
        availability: {
          inStock: boolean;
          quantity: number;
          reservations?: number;
        };
      }> = [];

      for (const product of products || []) {
        // Skip if client already owns this product (for serialized items)
        if (excludeOwned && await this.clientOwnsProduct(clientId, product.id)) {
          continue;
        }

        // Calculate recommendation score
        const score = await this.calculateRecommendationScore(clientId, product as any, purchaseHistory);
        
        if (score > 0) {
          const availability = await this.getProductAvailability(product.id);
          
          recommendations.push({
            product: product as any,
            score,
            reason: this.getRecommendationReason(score, purchaseHistory, product as any),
            availability
          });
        }
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('AdvancedInventoryClientIntegration: Error getting recommendations', error);
      return [];
    }
  }

  /**
   * Reserve inventory for a specific client with advanced business logic
   */
  static async createAdvancedReservation(
    clientId: string,
    productId: string,
    quantity: number,
    options: {
      duration?: number; // minutes
      priority?: 'low' | 'normal' | 'high';
      autoRelease?: boolean;
      clientNotes?: string;
    } = {}
  ): Promise<{
    reservationId: string;
    expiresAt: Date;
    confirmedQuantity: number;
  }> {
    const {
      duration = 30,
      priority = 'normal',
      autoRelease = true,
      clientNotes
    } = options;

    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'create_inventory_reservation',
      clientId,
      productId,
      quantity,
      options
    });

    try {
      // Step 1: Validate client and product
      await transactionCoordinator.executeInTransaction(
        transactionId,
        'validate_reservation_eligibility',
        'clients',
        async () => {
          await this.validateReservationEligibility(clientId, productId, quantity);
        }
      );

      // Step 2: Check and reserve inventory
      const reservation = await transactionCoordinator.executeInTransaction(
        transactionId,
        'reserve_inventory',
        'inventory',
        async () => {
          const availability = await this.getProductAvailability(productId);
          
          if (!availability.inStock || availability.quantity < quantity) {
            throw new Error(`Insufficient inventory. Available: ${availability.quantity}, Requested: ${quantity}`);
          }

          // Create reservation record
          const reservationId = `res_${Date.now()}_${Math.random()}`;
          const expiresAt = new Date(Date.now() + duration * 60 * 1000);

          // In a real implementation, this would create a reservation record
          // For now, we'll emit an event and return the reservation info
          await eventBus.emit({
            type: 'inventory.reservation_created',
            module: 'inventory',
            operation: 'create',
            entityId: reservationId,
            data: {
              clientId,
              productId,
              quantity,
              expiresAt,
              priority,
              clientNotes
            }
          });

          return {
            reservationId,
            expiresAt,
            confirmedQuantity: quantity
          };
        },
        async () => {
          // Compensation: cancel reservation
          logger.info('Compensated: Cancelled inventory reservation', { 
            clientId, 
            productId, 
            quantity 
          });
        }
      );

      // Step 3: Set up auto-release if enabled
      if (autoRelease) {
        setTimeout(async () => {
          await this.releaseReservation(reservation.reservationId, 'auto_expired');
        }, duration * 60 * 1000);
      }

      await transactionCoordinator.commitTransaction(transactionId);
      return reservation;

    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  /**
   * Get client-specific pricing with business rules
   */
  static async getClientSpecificPricing(
    clientId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{
    basePrice: number;
    clientPrice: number;
    discountPercentage: number;
    discountReason: string;
    validUntil?: Date;
    tierBenefits?: string[];
  }> {
    try {
      // Get product base price
      const { data: product } = await supabase
        .from('products')
        .select('price, min_price, max_price')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Get client information
      const { data: client } = await supabase
        .from('clients')
        .select('type, created_at')
        .eq('id', clientId)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      // Get client's purchase history for tier calculation
      const clientAnalytics = await this.getClientTierInfo(clientId);

      const basePrice = Number(product.price);
      let discountPercentage = 0;
      let discountReason = 'No discount applied';
      const tierBenefits: string[] = [];

      // Apply business client discount
      if (client.type === 'business') {
        discountPercentage += 5;
        discountReason = 'Business client discount';
        tierBenefits.push('5% business discount');
      }

      // Apply loyalty tier discounts
      if (clientAnalytics.totalPurchases >= 10) {
        discountPercentage += 10;
        discountReason = 'Loyal customer discount';
        tierBenefits.push('10% loyalty discount');
      } else if (clientAnalytics.totalPurchases >= 5) {
        discountPercentage += 5;
        discountReason = 'Regular customer discount';
        tierBenefits.push('5% regular customer discount');
      }

      // Apply volume discounts
      if (quantity >= 10) {
        discountPercentage += 15;
        discountReason = 'Volume discount';
        tierBenefits.push('15% volume discount');
      } else if (quantity >= 5) {
        discountPercentage += 10;
        discountReason = 'Volume discount';
        tierBenefits.push('10% volume discount');
      }

      // Apply seasonal or promotional discounts
      if (clientAnalytics.daysSinceLastPurchase > 90) {
        discountPercentage += 5;
        discountReason = 'Welcome back discount';
        tierBenefits.push('5% welcome back discount');
      }

      // Cap discount at 25%
      discountPercentage = Math.min(discountPercentage, 25);

      const clientPrice = basePrice * (1 - discountPercentage / 100);

      // Ensure price doesn't go below minimum
      const finalPrice = Math.max(clientPrice, Number(product.min_price) || 0);

      return {
        basePrice,
        clientPrice: finalPrice,
        discountPercentage,
        discountReason,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        tierBenefits
      };

    } catch (error) {
      logger.error('AdvancedInventoryClientIntegration: Error getting client pricing', error);
      throw error;
    }
  }

  /**
   * Check if client owns a specific product (for serialized items)
   */
  private static async clientOwnsProduct(clientId: string, productId: string): Promise<boolean> {
    const { data: sales } = await supabase
      .from('sales')
      .select(`
        sale_items (
          product_id,
          serial_number
        )
      `)
      .eq('client_id', clientId);

    return (sales || []).some(sale => 
      (sale.sale_items as any[])?.some(item => 
        item.product_id === productId && item.serial_number
      )
    );
  }

  /**
   * Calculate recommendation score based on client history and product attributes
   */
  private static async calculateRecommendationScore(
    clientId: string,
    product: Product,
    purchaseHistory: any[]
  ): Promise<number> {
    let score = 0;

    // Base score for in-stock items
    if (product.stock > 0) {
      score += 10;
    }

    // Brand preference scoring
    const brandPurchases = purchaseHistory.filter(p => p.brand === product.brand).length;
    if (brandPurchases > 0) {
      score += brandPurchases * 5;
    }

    // Category preference scoring
    const categoryPurchases = purchaseHistory.filter(p => p.category_id === product.category_id).length;
    if (categoryPurchases > 0) {
      score += categoryPurchases * 3;
    }

    // Price range preference scoring
    const avgPurchasePrice = purchaseHistory.reduce((sum, p) => sum + p.price, 0) / purchaseHistory.length;
    const priceDifference = Math.abs(Number(product.price) - avgPurchasePrice);
    const priceScore = Math.max(0, 20 - (priceDifference / avgPurchasePrice) * 100);
    score += priceScore;

    // Complementary product scoring
    // (Products often bought together)
    const complementaryScore = await this.getComplementaryProductScore(product.id, purchaseHistory);
    score += complementaryScore;

    return Math.round(score);
  }

  /**
   * Get complementary product score
   */
  private static async getComplementaryProductScore(productId: string, purchaseHistory: any[]): Promise<number> {
    // This would analyze products frequently bought together
    // For now, return a basic score
    return 5;
  }

  /**
   * Get product availability information
   */
  private static async getProductAvailability(productId: string): Promise<{
    inStock: boolean;
    quantity: number;
    reservations?: number;
  }> {
    const { data: product } = await supabase
      .from('products')
      .select('stock, has_serial')
      .eq('id', productId)
      .single();

    if (!product) {
      return { inStock: false, quantity: 0 };
    }

    if (product.has_serial) {
      // For serialized products, count available units
      const { data: units } = await supabase
        .from('product_units')
        .select('id')
        .eq('product_id', productId)
        .eq('status', 'available');

      const availableUnits = (units || []).length;
      return {
        inStock: availableUnits > 0,
        quantity: availableUnits,
        reservations: 0 // Would be calculated from reservations table
      };
    }

    return {
      inStock: product.stock > 0,
      quantity: product.stock,
      reservations: 0 // Would be calculated from reservations table
    };
  }

  /**
   * Get client's purchase history for analysis
   */
  private static async getClientPurchaseHistory(clientId: string): Promise<any[]> {
    const { data: sales } = await supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total_amount,
        sale_items (
          product_id,
          quantity,
          unit_price,
          products (
            brand,
            category_id
          )
        )
      `)
      .eq('client_id', clientId)
      .order('sale_date', { ascending: false });

    const history: any[] = [];
    
    (sales || []).forEach(sale => {
      (sale.sale_items as any[])?.forEach(item => {
        if (item.products) {
          history.push({
            saleId: sale.id,
            saleDate: sale.sale_date,
            productId: item.product_id,
            quantity: item.quantity,
            price: item.unit_price,
            brand: item.products.brand,
            category_id: item.products.category_id
          });
        }
      });
    });

    return history;
  }

  /**
   * Get client tier information
   */
  private static async getClientTierInfo(clientId: string): Promise<{
    totalPurchases: number;
    totalSpent: number;
    daysSinceLastPurchase: number;
    averageOrderValue: number;
  }> {
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, sale_date')
      .eq('client_id', clientId)
      .order('sale_date', { ascending: false });

    const salesList = sales || [];
    const totalPurchases = salesList.length;
    const totalSpent = salesList.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

    let daysSinceLastPurchase = 9999;
    if (salesList.length > 0) {
      const lastPurchase = new Date(salesList[0].sale_date);
      daysSinceLastPurchase = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      totalPurchases,
      totalSpent,
      daysSinceLastPurchase,
      averageOrderValue
    };
  }

  /**
   * Validate reservation eligibility
   */
  private static async validateReservationEligibility(
    clientId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    // Check client status
    const { data: client } = await supabase
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .single();

    if (!client || client.status !== 'active') {
      throw new Error('Client is not eligible for reservations');
    }

    // Check product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Additional business rules could be added here
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if (quantity > 100) {
      throw new Error('Quantity exceeds maximum allowed for reservations');
    }
  }

  /**
   * Release a reservation
   */
  private static async releaseReservation(reservationId: string, reason: string): Promise<void> {
    await eventBus.emit({
      type: 'inventory.reservation_released',
      module: 'inventory',
      operation: 'update',
      entityId: reservationId,
      data: { reason }
    });

    logger.info('AdvancedInventoryClientIntegration: Reservation released', { 
      reservationId, 
      reason 
    });
  }

  /**
   * Get recommendation reason text
   */
  private static getRecommendationReason(score: number, purchaseHistory: any[], product: Product): string {
    if (score > 50) {
      return 'Highly recommended based on your purchase history';
    } else if (score > 30) {
      return 'Recommended for you';
    } else if (score > 20) {
      return 'Popular in your preferred category';
    } else {
      return 'Currently available';
    }
  }
}