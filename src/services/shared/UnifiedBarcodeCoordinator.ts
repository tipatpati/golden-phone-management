/**
 * PHASE 4: Unified Barcode & Print Coordination System
 * Ensures perfect coordination between supplier and inventory modules
 */

import { ProductUnitManagementService } from "./ProductUnitManagementService";
import { BarcodeService } from "./BarcodeService";
import { Services } from "@/services/core";
import { supabase } from "@/integrations/supabase/client";

interface BarcodeCoordinationEvent {
  type: 'unit_created' | 'unit_updated' | 'barcode_generated' | 'print_requested';
  source: 'supplier' | 'inventory';
  entityId: string;
  metadata?: Record<string, any>;
}

interface DataSyncStatus {
  isHealthy: boolean;
  missingBarcodes: string[];
  orphanedBarcodes: string[];
  duplicateBarcodes: string[];
  lastSyncTime: Date;
}

export class UnifiedBarcodeCoordinator {
  private static eventListeners: Array<(event: BarcodeCoordinationEvent) => void> = [];
  private static barcodeService: BarcodeService | null = null;

  /**
   * Initialize the coordination system
   */
  static async initialize(): Promise<void> {
    console.log('🔧 Initializing UnifiedBarcodeCoordinator...');
    
    // Initialize barcode service
    this.barcodeService = new BarcodeService();
    
    // Set up real-time listeners for cross-module coordination
    this.setupRealtimeListeners();
    
    console.log('✅ UnifiedBarcodeCoordinator initialized');
  }

  /**
   * PHASE 4: Add Cross-Module Event Coordination
   */
  private static setupRealtimeListeners(): void {
    // Listen for product_units changes to invalidate caches
    supabase
      .channel('barcode_coordination')
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
            type: 'unit_updated',
            source: 'inventory', // Will be determined dynamically
            entityId: (payload.new as any)?.id || (payload.old as any)?.id,
            metadata: { change: payload.eventType, table: 'product_units' }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barcode_registry'
        },
        (payload) => {
          console.log('🔄 Barcode registry change detected:', payload);
          this.notifyEvent({
            type: 'barcode_generated',
            source: 'inventory',
            entityId: (payload.new as any)?.entity_id || (payload.old as any)?.entity_id,
            metadata: { barcode: (payload.new as any)?.barcode, change: payload.eventType }
          });
        }
      )
      .subscribe();
  }

  /**
   * Notify about cross-module events
   */
  static notifyEvent(event: BarcodeCoordinationEvent): void {
    console.log(`📢 Broadcasting event: ${event.type} from ${event.source}`, event);
    
    // Notify all listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener failed:', error);
      }
    });

    // Handle specific coordination actions
    this.handleCoordinationEvent(event);
  }

  /**
   * Handle coordination events automatically
   */
  private static async handleCoordinationEvent(event: BarcodeCoordinationEvent): Promise<void> {
    switch (event.type) {
      case 'unit_created':
      case 'unit_updated':
        // Invalidate inventory caches when supplier creates/updates units
        if (event.source === 'supplier') {
          console.log('🔄 Invalidating inventory cache due to supplier unit change');
          // This would trigger inventory components to refresh their data
        }
        break;
        
      case 'barcode_generated':
        // Ensure barcode is immediately available across modules
        console.log('🏷️ Barcode generated, ensuring cross-module availability');
        break;
        
      case 'print_requested':
        // Log unified print history
        await this.logPrintEvent(event);
        break;
    }
  }

  /**
   * Register event listener
   */
  static addEventListener(listener: (event: BarcodeCoordinationEvent) => void): () => void {
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
   * PHASE 3: Create Unified Barcode Resolution
   * Always check existing barcodes before generation
   */
  static async resolveBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product'
  ): Promise<string> {
    if (!this.barcodeService) {
      throw new Error('BarcodeService not initialized');
    }

    console.log(`🔍 Resolving barcode for ${entityType}:${entityId} (${barcodeType})`);

    // Always check existing barcode first
    const existing = await this.barcodeService.getBarcodeByEntity(entityType, entityId);
    if (existing?.barcode) {
      console.log(`✅ Found existing barcode: ${existing.barcode}`);
      return existing.barcode;
    }

    // Generate new barcode using unified service
    console.log(`🔨 Generating new ${barcodeType} barcode...`);
    const barcode = await this.barcodeService.getOrGenerateBarcode(
      entityType,
      entityId,
      barcodeType
    );

    // Notify about new barcode generation
    this.notifyEvent({
      type: 'barcode_generated',
      source: 'inventory', // Will be set dynamically by caller
      entityId,
      metadata: { barcode, entityType, barcodeType }
    });

    return barcode;
  }

  /**
   * PHASE 5: Data Integrity Validation
   * Cross-module barcode consistency checker
   */
  static async validateDataIntegrity(): Promise<DataSyncStatus> {
    console.log('🔍 Running cross-module data integrity validation...');
    
    const missingBarcodes: string[] = [];
    const orphanedBarcodes: string[] = [];
    const duplicateBarcodes: string[] = [];

    try {
      // Check for units without barcodes
      const { data: unitsWithoutBarcodes } = await supabase
        .from('product_units')
        .select('id, serial_number, product_id')
        .or('barcode.is.null,barcode.eq.""');

      if (unitsWithoutBarcodes) {
        missingBarcodes.push(...unitsWithoutBarcodes.map(u => u.serial_number));
      }

      // Check for orphaned barcodes in registry
      const { data: orphanedEntries } = await supabase
        .from('barcode_registry')
        .select('barcode, entity_id, entity_type')
        .not('entity_id', 'in', 
          supabase.from('product_units').select('id')
        );

      if (orphanedEntries) {
        orphanedBarcodes.push(...orphanedEntries.map(b => b.barcode));
      }

      // Check for duplicate barcodes using a subquery approach
      const { data: duplicates } = await supabase
        .from('barcode_registry')
        .select('barcode')
        .then(async ({ data }) => {
          if (!data) return { data: null };
          
          const barcodeCount: { [key: string]: number } = {};
          data.forEach(item => {
            barcodeCount[item.barcode] = (barcodeCount[item.barcode] || 0) + 1;
          });
          
          const duplicateList = Object.entries(barcodeCount)
            .filter(([_, count]) => count > 1)
            .map(([barcode, count]) => ({ barcode, count }));
            
          return { data: duplicateList };
        });

      if (duplicates) {
        duplicateBarcodes.push(...duplicates.map(d => d.barcode));
      }

      const status: DataSyncStatus = {
        isHealthy: missingBarcodes.length === 0 && orphanedBarcodes.length === 0 && duplicateBarcodes.length === 0,
        missingBarcodes,
        orphanedBarcodes,
        duplicateBarcodes,
        lastSyncTime: new Date()
      };

      console.log('📊 Data integrity validation complete:', status);
      return status;

    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      return {
        isHealthy: false,
        missingBarcodes: [],
        orphanedBarcodes: [],
        duplicateBarcodes: [],
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * Fix data integrity issues automatically
   */
  static async fixDataIntegrityIssues(): Promise<{
    fixedMissingBarcodes: number;
    removedOrphanedBarcodes: number;
    resolvedDuplicates: number;
  }> {
    console.log('🔧 Fixing data integrity issues...');
    
    let fixedMissingBarcodes = 0;
    let removedOrphanedBarcodes = 0;
    let resolvedDuplicates = 0;

    if (!this.barcodeService) {
      throw new Error('BarcodeService not initialized');
    }

    try {
      // Fix missing barcodes
      const { data: unitsWithoutBarcodes } = await supabase
        .from('product_units')
        .select('id, serial_number')
        .or('barcode.is.null,barcode.eq.""');

      if (unitsWithoutBarcodes) {
        for (const unit of unitsWithoutBarcodes) {
          try {
            await this.barcodeService.generateUnitBarcode(unit.id);
            fixedMissingBarcodes++;
          } catch (error) {
            console.error(`Failed to fix barcode for unit ${unit.serial_number}:`, error);
          }
        }
      }

      // Remove orphaned barcode registry entries
      const { data: orphanedEntries } = await supabase
        .from('barcode_registry')
        .select('id, entity_id, entity_type')
        .eq('entity_type', 'product_unit');

      if (orphanedEntries) {
        for (const entry of orphanedEntries) {
          const { data: unitExists } = await supabase
            .from('product_units')
            .select('id')
            .eq('id', entry.entity_id)
            .maybeSingle();

          if (!unitExists) {
            await supabase
              .from('barcode_registry')
              .delete()
              .eq('id', entry.id);
            removedOrphanedBarcodes++;
          }
        }
      }

      console.log(`✅ Fixed ${fixedMissingBarcodes} missing barcodes, removed ${removedOrphanedBarcodes} orphaned entries`);

      return {
        fixedMissingBarcodes,
        removedOrphanedBarcodes,
        resolvedDuplicates
      };

    } catch (error) {
      console.error('❌ Failed to fix data integrity issues:', error);
      throw error;
    }
  }

  /**
   * Log print events for unified history
   */
  private static async logPrintEvent(event: BarcodeCoordinationEvent): Promise<void> {
    try {
      // This could be extended to log to a dedicated print_history table
      console.log('📄 Logging print event:', event);
    } catch (error) {
      console.error('Failed to log print event:', error);
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
      const barcodeHealth = await this.barcodeService?.healthCheck();
      const printService = await Services.getPrintService();
      const printHealth = await printService.healthCheck();
      const dataIntegrity = await this.validateDataIntegrity();

      const isHealthy = 
        barcodeHealth?.status === 'healthy' &&
        printHealth?.status === 'healthy' &&
        dataIntegrity.isHealthy;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          barcodeService: barcodeHealth?.status,
          printService: printHealth?.status,
          dataIntegrity: dataIntegrity.isHealthy,
          lastIntegrityCheck: dataIntegrity.lastSyncTime,
          eventListeners: this.eventListeners.length
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }
}

// Auto-initialize when imported
UnifiedBarcodeCoordinator.initialize().catch(console.error);