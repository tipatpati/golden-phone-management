/**
 * PHASE 4: Unified Product & Unit Coordination System
 * Ensures perfect coordination between supplier and inventory modules for products and product units
 */

import { ProductUnitManagementService } from "./ProductUnitManagementService";
import { supabase } from "@/integrations/supabase/client";

interface ProductCoordinationEvent {
  type: 'product_created' | 'product_updated' | 'unit_created' | 'unit_updated' | 'stock_updated' | 'sync_requested';
  source: 'supplier' | 'inventory';
  entityId: string;
  metadata?: Record<string, any>;
}

interface ProductSyncStatus {
  isHealthy: boolean;
  missingBarcodes: Array<{ productId: string; issueType: string; description: string }>;
  orphanedUnits: string[];
  duplicateSerials: string[];
  inconsistentFlags: string[];
  lastSyncTime: Date;
}

export class UnifiedProductCoordinator {
  private static eventListeners: Array<(event: ProductCoordinationEvent) => void> = [];

  /**
   * Initialize the product coordination system
   */
  static async initialize(): Promise<void> {
    console.log('🔧 Initializing UnifiedProductCoordinator...');
    
    // Set up real-time listeners for cross-module coordination
    this.setupRealtimeListeners();
    
    console.log('✅ UnifiedProductCoordinator initialized');
  }

  /**
   * PHASE 4: Add Cross-Module Event Coordination for Products
   */
  private static setupRealtimeListeners(): void {
    // Listen for products changes to invalidate caches
    supabase
      .channel('product_coordination')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('🔄 Product change detected:', payload);
          this.notifyEvent({
            type: payload.eventType === 'INSERT' ? 'product_created' : 'product_updated',
            source: 'inventory', // Will be determined dynamically
            entityId: (payload.new as any)?.id || (payload.old as any)?.id,
            metadata: { 
              change: payload.eventType, 
              table: 'products',
              brand: (payload.new as any)?.brand,
              model: (payload.new as any)?.model
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_units'
        },
        (payload) => {
          console.log('🔄 Product unit change detected:', payload);
          this.notifyEvent({
            type: payload.eventType === 'INSERT' ? 'unit_created' : 'unit_updated',
            source: 'inventory',
            entityId: (payload.new as any)?.id || (payload.old as any)?.id,
            metadata: { 
              change: payload.eventType, 
              table: 'product_units',
              productId: (payload.new as any)?.product_id,
              serialNumber: (payload.new as any)?.serial_number
            }
          });
        }
      )
      .subscribe();
  }

  /**
   * Notify about cross-module events
   */
  static notifyEvent(event: ProductCoordinationEvent): void {
    console.log(`📢 Broadcasting product event: ${event.type} from ${event.source}`, event);
    
    // Notify all listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Product event listener failed:', error);
      }
    });

    // Handle specific coordination actions
    this.handleCoordinationEvent(event);
  }

  /**
   * Handle coordination events automatically
   */
  private static async handleCoordinationEvent(event: ProductCoordinationEvent): Promise<void> {
    switch (event.type) {
      case 'product_created':
      case 'product_updated':
        // Invalidate inventory caches when supplier creates/updates products
        if (event.source === 'supplier') {
          console.log('🔄 Invalidating inventory cache due to supplier product change');
          // This would trigger inventory components to refresh their data
        }
        break;
        
      case 'unit_created':
      case 'unit_updated':
        // Ensure cross-module unit synchronization
        console.log('📦 Product unit modified, ensuring cross-module synchronization');
        await this.ensureUnitProductConsistency(event.entityId);
        break;
        
      case 'sync_requested':
        // Perform full synchronization
        await this.performFullSync();
        break;
    }
  }

  /**
   * Register event listener
   */
  static addEventListener(listener: (event: ProductCoordinationEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * PHASE 3: Unified Product Resolution
   * Always check existing products/units before creation
   */
  static async resolveProduct(
    brand: string,
    model: string,
    additionalData?: Record<string, any>
  ): Promise<{ product: any; isExisting: boolean }> {
    console.log(`🔍 Resolving product: ${brand} ${model}`);

    // Check for existing product first
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*')
      .eq('brand', brand)
      .eq('model', model)
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      console.log(`✅ Found existing product: ${existingProducts[0].id}`);
      return { product: existingProducts[0], isExisting: true };
    }

    // Create new product if not found
    console.log(`🔨 Creating new product: ${brand} ${model}`);
    // Sanitize additionalData to include only valid product columns (prevent schema errors)
    const allowedKeys = new Set([
      'price','stock','threshold','has_serial','category_id','barcode','description','supplier','year','min_price','max_price','serial_numbers'
    ]);
    const sanitizedAdditional: Record<string, any> = {};
    if (additionalData) {
      for (const [k, v] of Object.entries(additionalData)) {
        if (allowedKeys.has(k)) sanitizedAdditional[k] = v;
      }
    }
    const productData = {
      brand,
      model,
      price: sanitizedAdditional.price ?? 0,
      stock: sanitizedAdditional.stock ?? 0,
      threshold: sanitizedAdditional.threshold ?? 0,
      has_serial: sanitizedAdditional.has_serial ?? false,
      category_id: sanitizedAdditional.category_id,
      ...sanitizedAdditional
    };

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    // Notify about new product creation
    this.notifyEvent({
      type: 'product_created',
      source: 'inventory', // Will be set dynamically by caller
      entityId: newProduct.id,
      metadata: { brand, model, created: true }
    });

    return { product: newProduct, isExisting: false };
  }

  /**
   * PHASE 3: Unified Unit Resolution
   * Resolve or create product units with proper validation
   */
  static async resolveProductUnit(
    productId: string,
    serialNumber: string,
    unitData?: Record<string, any>
  ): Promise<{ unit: any; isExisting: boolean }> {
    console.log(`🔍 Resolving product unit: ${serialNumber} for product ${productId}`);

    // Check for existing unit first
    const { data: existingUnit } = await supabase
      .from('product_units')
      .select('*')
      .eq('product_id', productId)
      .eq('serial_number', serialNumber)
      .maybeSingle();

    if (existingUnit) {
      console.log(`✅ Found existing unit: ${existingUnit.id}`);
      return { unit: existingUnit, isExisting: true };
    }

    // Create new unit if not found
    console.log(`🔨 Creating new product unit: ${serialNumber}`);
    const newUnitData = {
      product_id: productId,
      serial_number: serialNumber,
      status: 'available',
      ...unitData
    };

    const { data: newUnit, error } = await supabase
      .from('product_units')
      .insert([newUnitData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product unit: ${error.message}`);
    }

    // Notify about new unit creation
    this.notifyEvent({
      type: 'unit_created',
      source: 'inventory', // Will be set dynamically by caller
      entityId: newUnit.id,
      metadata: { productId, serialNumber, created: true }
    });

    return { unit: newUnit, isExisting: false };
  }

  /**
   * PHASE 5: Data Integrity Validation for Products
   * Cross-module product and unit consistency checker
   */
  static async validateProductIntegrity(): Promise<ProductSyncStatus> {
    console.log('🔍 Running cross-module product integrity validation...');
    
    try {
      // Use the database function for comprehensive validation
      const { data: issues } = await supabase.rpc('validate_product_consistency');
      
      const missingBarcodes: Array<{ productId: string; issueType: string; description: string }> = [];
      const orphanedUnits: string[] = [];
      const duplicateSerials: string[] = [];
      const inconsistentFlags: string[] = [];

      if (issues) {
        issues.forEach((issue: any) => {
          switch (issue.issue_type) {
            case 'missing_barcode':
            case 'unit_missing_barcode':
              missingBarcodes.push({
                productId: issue.product_id,
                issueType: issue.issue_type,
                description: issue.description
              });
              break;
            case 'orphaned_unit':
              orphanedUnits.push(issue.description);
              break;
            case 'duplicate_serial':
              duplicateSerials.push(issue.description);
              break;
            case 'incorrect_serial_flag':
              inconsistentFlags.push(issue.description);
              break;
          }
        });
      }

      const status: ProductSyncStatus = {
        isHealthy: issues ? issues.length === 0 : true,
        missingBarcodes,
        orphanedUnits,
        duplicateSerials,
        inconsistentFlags,
        lastSyncTime: new Date()
      };

      console.log('📊 Product integrity validation complete:', status);
      return status;

    } catch (error) {
      console.error('❌ Product integrity validation failed:', error);
      return {
        isHealthy: false,
        missingBarcodes: [],
        orphanedUnits: [],
        duplicateSerials: [],
        inconsistentFlags: [],
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * Fix product integrity issues automatically
   */
  static async fixProductIntegrityIssues(): Promise<{
    fixedBarcodes: number;
    fixedFlags: number;
    fixedUnits: number;
  }> {
    console.log('🔧 Fixing product integrity issues...');
    
    try {
      // Use the database function for comprehensive fixes
      const { data: results } = await supabase.rpc('fix_product_consistency_issues');
      
      let fixedBarcodes = 0;
      let fixedFlags = 0;
      let fixedUnits = 0;

      if (results) {
        results.forEach((result: any) => {
          switch (result.fixed_type) {
            case 'product_barcodes':
            case 'unit_barcodes':
              fixedBarcodes += result.fixed_count;
              break;
            case 'serial_flags':
              fixedFlags += result.fixed_count;
              break;
            default:
              fixedUnits += result.fixed_count;
          }
        });
      }

      console.log(`✅ Fixed ${fixedBarcodes} barcodes, ${fixedFlags} flags, ${fixedUnits} units`);

      return {
        fixedBarcodes,
        fixedFlags,
        fixedUnits
      };

    } catch (error) {
      console.error('❌ Failed to fix product integrity issues:', error);
      throw error;
    }
  }

  /**
   * Ensure unit-product consistency
   */
  private static async ensureUnitProductConsistency(unitId: string): Promise<void> {
    try {
      // Get unit information
      const { data: unit } = await supabase
        .from('product_units')
        .select('*, products(*)')
        .eq('id', unitId)
        .single();

      if (!unit) return;

      // Ensure product has correct has_serial flag
      if (unit.products && !unit.products.has_serial) {
        await supabase
          .from('products')
          .update({ has_serial: true, updated_at: new Date().toISOString() })
          .eq('id', unit.product_id);
        
        console.log(`✅ Updated has_serial flag for product ${unit.product_id}`);
      }

    } catch (error) {
      console.error('Failed to ensure unit-product consistency:', error);
    }
  }

  /**
   * Perform full synchronization
   */
  private static async performFullSync(): Promise<void> {
    console.log('🔄 Performing full product synchronization...');
    
    try {
      // Fix any existing issues
      await this.fixProductIntegrityIssues();
      
      // Validate current state
      const status = await this.validateProductIntegrity();
      
      if (status.isHealthy) {
        console.log('✅ Full product synchronization complete - all systems healthy');
      } else {
        console.warn('⚠️ Full product synchronization complete - some issues remain:', status);
      }

    } catch (error) {
      console.error('❌ Full product synchronization failed:', error);
    }
  }

  /**
   * Get service health status
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const productIntegrity = await this.validateProductIntegrity();

      const isHealthy = productIntegrity.isHealthy;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          productIntegrity: productIntegrity.isHealthy,
          lastIntegrityCheck: productIntegrity.lastSyncTime,
          eventListeners: this.eventListeners.length,
          issuesSummary: {
            missingBarcodes: productIntegrity.missingBarcodes.length,
            orphanedUnits: productIntegrity.orphanedUnits.length,
            duplicateSerials: productIntegrity.duplicateSerials.length,
            inconsistentFlags: productIntegrity.inconsistentFlags.length
          }
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Request immediate synchronization
   */
  static async requestSync(): Promise<void> {
    this.notifyEvent({
      type: 'sync_requested',
      source: 'inventory',
      entityId: 'system',
      metadata: { timestamp: new Date().toISOString() }
    });
  }
}

// Auto-initialize when imported
UnifiedProductCoordinator.initialize().catch(console.error);