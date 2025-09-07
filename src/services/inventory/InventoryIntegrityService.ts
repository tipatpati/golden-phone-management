/**
 * INVENTORY INTEGRITY SERVICE
 * Ensures data consistency between Sales and Inventory modules
 */

import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductUnit } from "./types";

export interface IntegrityReport {
  stockMismatches: StockMismatch[];
  orphanedUnits: OrphanedUnit[];
  invalidSerialSales: InvalidSerialSale[];
  inconsistentStatuses: InconsistentStatus[];
  suggestions: string[];
}

interface StockMismatch {
  productId: string;
  brand: string;
  model: string;
  recordedStock: number;
  actualAvailableUnits: number;
  difference: number;
}

interface OrphanedUnit {
  unitId: string;
  productId: string;
  serialNumber: string;
  status: string;
  reason: string;
}

interface InvalidSerialSale {
  saleId: string;
  saleNumber: string;
  productId: string;
  serialNumber: string;
  issue: string;
}

interface InconsistentStatus {
  unitId: string;
  serialNumber: string;
  unitStatus: string;
  saleStatus: string | null;
  issue: string;
}

export class InventoryIntegrityService {
  /**
   * Comprehensive integrity check between Sales and Inventory
   */
  static async runIntegrityCheck(): Promise<IntegrityReport> {
    console.log('🔍 Running inventory integrity check...');
    
    const report: IntegrityReport = {
      stockMismatches: [],
      orphanedUnits: [],
      invalidSerialSales: [],
      inconsistentStatuses: [],
      suggestions: []
    };

    try {
      // Check stock consistency
      await this.checkStockConsistency(report);
      
      // Check unit status consistency  
      await this.checkUnitStatusConsistency(report);
      
      // Check serial number integrity in sales
      await this.checkSerialIntegrityInSales(report);
      
      // Check for orphaned units
      await this.checkOrphanedUnits(report);
      
      // Generate suggestions
      this.generateSuggestions(report);
      
      console.log('✅ Integrity check completed');
      return report;
    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      throw error;
    }
  }

  /**
   * Check if recorded stock matches actual available units
   */
  private static async checkStockConsistency(report: IntegrityReport): Promise<void> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, brand, model, stock, has_serial,
        product_units!inner(id, status)
      `);

    if (error) throw error;

    for (const product of products || []) {
      if (!product.has_serial) continue; // Skip non-serialized products

      const availableUnits = product.product_units?.filter(
        (unit: any) => unit.status === 'available'
      ).length || 0;

      const recordedStock = product.stock || 0;

      if (recordedStock !== availableUnits) {
        report.stockMismatches.push({
          productId: product.id,
          brand: product.brand,
          model: product.model,
          recordedStock,
          actualAvailableUnits: availableUnits,
          difference: recordedStock - availableUnits
        });
      }
    }
  }

  /**
   * Check if unit statuses are consistent with sale records
   */
  private static async checkUnitStatusConsistency(report: IntegrityReport): Promise<void> {
    // Check sold units without active sales by using RPC or direct queries
    const { data: soldUnits, error: soldError } = await supabase
      .from('product_units')
      .select('id, serial_number, status, product_id')
      .eq('status', 'sold');

    if (soldError) throw soldError;

    for (const unit of soldUnits || []) {
      // Check if this unit has any active sales
      const { data: saleItems, error: saleError } = await supabase
        .from('sale_items')
        .select(`
          id,
          sales!inner(id, status)
        `)
        .eq('serial_number', unit.serial_number)
        .eq('product_id', unit.product_id);

      if (saleError) continue; // Skip on error

      const activeSales = saleItems?.filter(
        (item: any) => item.sales?.status === 'completed'
      );

      if (!activeSales || activeSales.length === 0) {
        report.inconsistentStatuses.push({
          unitId: unit.id,
          serialNumber: unit.serial_number,
          unitStatus: unit.status,
          saleStatus: null,
          issue: 'Unit marked as sold but no active sale found'
        });
      }
    }

    // Check available units with active sales
    const { data: availableUnits, error: availError } = await supabase
      .from('product_units')
      .select('id, serial_number, status, product_id')
      .eq('status', 'available');

    if (availError) throw availError;

    for (const unit of availableUnits || []) {
      // Check if this unit has any active sales
      const { data: saleItems, error: saleError } = await supabase
        .from('sale_items')
        .select(`
          id,
          sales!inner(id, status)
        `)
        .eq('serial_number', unit.serial_number)
        .eq('product_id', unit.product_id);

      if (saleError) continue; // Skip on error

      const activeSales = saleItems?.filter(
        (item: any) => item.sales?.status === 'completed'
      );

      if (activeSales && activeSales.length > 0) {
        report.inconsistentStatuses.push({
          unitId: unit.id,
          serialNumber: unit.serial_number,
          unitStatus: unit.status,
          saleStatus: 'completed',
          issue: 'Unit marked as available but has active sale'
        });
      }
    }
  }

  /**
   * Check serial number integrity in sales
   */
  private static async checkSerialIntegrityInSales(report: IntegrityReport): Promise<void> {
    const { data: saleItems, error } = await supabase
      .from('sale_items')
      .select(`
        id, serial_number, product_id,
        sales!inner(id, sale_number, status),
        products!inner(id, brand, model, has_serial)
      `)
      .not('serial_number', 'is', null);

    if (error) throw error;

    for (const item of saleItems || []) {
      if (!item.products?.has_serial) {
        report.invalidSerialSales.push({
          saleId: item.sales?.id || '',
          saleNumber: item.sales?.sale_number || '',
          productId: item.product_id,
          serialNumber: item.serial_number || '',
          issue: 'Serial number assigned to non-serialized product'
        });
        continue;
      }

      // Check if serial exists as a unit
      const { data: unit, error: unitError } = await supabase
        .from('product_units')
        .select('id, status')
        .eq('product_id', item.product_id)
        .eq('serial_number', item.serial_number)
        .single();

      if (unitError || !unit) {
        report.invalidSerialSales.push({
          saleId: item.sales?.id || '',
          saleNumber: item.sales?.sale_number || '',
          productId: item.product_id,
          serialNumber: item.serial_number || '',
          issue: 'Serial number does not exist as product unit'
        });
      }
    }
  }

  /**
   * Check for orphaned units
   */
  private static async checkOrphanedUnits(report: IntegrityReport): Promise<void> {
    // Units without corresponding products
    const { data: orphanedUnits, error } = await supabase
      .from('product_units')
      .select(`
        id, serial_number, status, product_id,
        products(id)
      `)
      .is('products.id', null);

    if (error) throw error;

    for (const unit of orphanedUnits || []) {
      report.orphanedUnits.push({
        unitId: unit.id,
        productId: unit.product_id,
        serialNumber: unit.serial_number,
        status: unit.status,
        reason: 'Product no longer exists'
      });
    }
  }

  /**
   * Generate repair suggestions based on findings
   */
  private static generateSuggestions(report: IntegrityReport): void {
    if (report.stockMismatches.length > 0) {
      report.suggestions.push(
        `Found ${report.stockMismatches.length} stock mismatches. Consider running stock reconciliation.`
      );
    }

    if (report.inconsistentStatuses.length > 0) {
      report.suggestions.push(
        `Found ${report.inconsistentStatuses.length} status inconsistencies. Check unit status synchronization.`
      );
    }

    if (report.invalidSerialSales.length > 0) {
      report.suggestions.push(
        `Found ${report.invalidSerialSales.length} invalid serial sales. Review serial number validation.`
      );
    }

    if (report.orphanedUnits.length > 0) {
      report.suggestions.push(
        `Found ${report.orphanedUnits.length} orphaned units. Consider cleanup or data migration.`
      );
    }

    if (report.stockMismatches.length === 0 && 
        report.inconsistentStatuses.length === 0 && 
        report.invalidSerialSales.length === 0 && 
        report.orphanedUnits.length === 0) {
      report.suggestions.push('✅ All integrity checks passed! Data is consistent.');
    }
  }

  /**
   * Auto-repair common integrity issues
   */
  static async autoRepairIntegrity(): Promise<{
    repaired: number;
    errors: string[];
  }> {
    console.log('🔧 Starting auto-repair...');
    
    const result = {
      repaired: 0,
      errors: []
    };

    try {
      // Repair stock mismatches by recalculating from available units
      const stockRepairs = await this.repairStockMismatches();
      result.repaired += stockRepairs.repaired;
      result.errors.push(...stockRepairs.errors);

      // Repair unit status inconsistencies
      const statusRepairs = await this.repairStatusInconsistencies();
      result.repaired += statusRepairs.repaired;
      result.errors.push(...statusRepairs.errors);

      console.log(`✅ Auto-repair completed: ${result.repaired} issues fixed`);
    } catch (error) {
      console.error('❌ Auto-repair failed:', error);
      result.errors.push(`Auto-repair failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Repair stock mismatches
   */
  private static async repairStockMismatches(): Promise<{
    repaired: number;
    errors: string[];
  }> {
    const result = { repaired: 0, errors: [] };

    // Get products with serialized inventory
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, stock, has_serial,
        product_units(id, status)
      `)
      .eq('has_serial', true);

    if (error) {
      result.errors.push(`Failed to fetch products: ${error.message}`);
      return result;
    }

    for (const product of products || []) {
      const availableUnits = product.product_units?.filter(
        (unit: any) => unit.status === 'available'
      ).length || 0;

      if (product.stock !== availableUnits) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: availableUnits })
          .eq('id', product.id);

        if (updateError) {
          result.errors.push(`Failed to update stock for product ${product.id}: ${updateError.message}`);
        } else {
          result.repaired++;
        }
      }
    }

    return result;
  }

  /**
   * Repair status inconsistencies
   */
  private static async repairStatusInconsistencies(): Promise<{
    repaired: number;
    errors: string[];
  }> {
    const result = { repaired: 0, errors: [] };

    // Find units marked as sold but with no active sales
    const { data: soldUnits, error } = await supabase
      .from('product_units')
      .select('id, serial_number, product_id')
      .eq('status', 'sold');

    if (error) {
      result.errors.push(`Failed to fetch sold units: ${error.message}`);
      return result;
    }

    for (const unit of soldUnits || []) {
      // Check if this unit has any active sales
      const { data: saleItems, error: saleError } = await supabase
        .from('sale_items')
        .select(`
          id,
          sales!inner(id, status)
        `)
        .eq('serial_number', unit.serial_number)
        .eq('product_id', unit.product_id);

      if (saleError) continue; // Skip on error

      const activeSales = saleItems?.filter(
        (item: any) => item.sales?.status === 'completed'
      );

      if (!activeSales || activeSales.length === 0) {
        // Mark unit as available since no active sale exists
        const { error: updateError } = await supabase
          .from('product_units')
          .update({ status: 'available' })
          .eq('id', unit.id);

        if (updateError) {
          result.errors.push(`Failed to update unit ${unit.id}: ${updateError.message}`);
        } else {
          result.repaired++;
        }
      }
    }

    return result;
  }
}