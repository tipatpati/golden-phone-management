import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { transactionCoordinator } from '../core/TransactionCoordinator';

export interface OrphanedUnit {
  id: string;
  product_id: string;
  serial_number: string;
  price: number;
  purchase_price: number | null;
  supplier_id: string | null;
  created_at: string;
  product_brand: string;
  product_model: string;
  orphan_type: 'no_supplier' | 'no_transaction';
  supplier_name?: string;
}

export interface RecoveryTransaction {
  supplier_id: string;
  notes?: string;
  unit_ids: string[];
  estimated_purchase_price?: number;
}

class OrphanedUnitsRecoveryService {
  /**
   * Find all orphaned product units
   * Type 1: Units without supplier_id
   * Type 2: Units with supplier_id but not linked to any transaction
   */
  async findOrphanedUnits(sinceDate?: Date): Promise<OrphanedUnit[]> {
    const since = sinceDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days by default
    
    // Type 1: Units with NULL supplier_id
    const { data: unitsWithoutSupplier, error: error1 } = await supabase
      .from('product_units')
      .select(`
        id,
        product_id,
        serial_number,
        price,
        purchase_price,
        supplier_id,
        created_at,
        products!inner(
          brand,
          model
        )
      `)
      .is('supplier_id', null)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error1) {
      logger.error('Failed to find units without supplier', { error: error1 });
      throw new Error(`Failed to find orphaned units: ${error1.message}`);
    }

    // Type 2: Units with supplier_id but not in any transaction
    const { data: allUnitsWithSupplier, error: error2 } = await supabase
      .from('product_units')
      .select(`
        id,
        product_id,
        serial_number,
        price,
        purchase_price,
        supplier_id,
        created_at,
        products!inner(
          brand,
          model
        ),
        suppliers(
          name
        )
      `)
      .not('supplier_id', 'is', null)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error2) {
      logger.error('Failed to find units with supplier', { error: error2 });
      throw new Error(`Failed to find orphaned units: ${error2.message}`);
    }

    // Check which units are not in any transaction
    const unitsWithSupplierButNoTransaction: OrphanedUnit[] = [];
    
    for (const unit of allUnitsWithSupplier || []) {
      const { data: transactionItems } = await supabase
        .from('supplier_transaction_items')
        .select('id')
        .contains('product_unit_ids', [unit.id])
        .limit(1);

      if (!transactionItems || transactionItems.length === 0) {
        unitsWithSupplierButNoTransaction.push({
          id: unit.id,
          product_id: unit.product_id,
          serial_number: unit.serial_number,
          price: unit.price || 0,
          purchase_price: unit.purchase_price,
          supplier_id: unit.supplier_id,
          created_at: unit.created_at,
          product_brand: unit.products.brand,
          product_model: unit.products.model,
          orphan_type: 'no_transaction',
          supplier_name: unit.suppliers?.name
        });
      }
    }

    // Combine both types
    const type1Units: OrphanedUnit[] = (unitsWithoutSupplier || []).map(unit => ({
      id: unit.id,
      product_id: unit.product_id,
      serial_number: unit.serial_number,
      price: unit.price || 0,
      purchase_price: unit.purchase_price,
      supplier_id: unit.supplier_id,
      created_at: unit.created_at,
      product_brand: unit.products.brand,
      product_model: unit.products.model,
      orphan_type: 'no_supplier' as const
    }));

    const allOrphans = [...type1Units, ...unitsWithSupplierButNoTransaction];

    logger.info('Found orphaned units', {
      type1_no_supplier: type1Units.length,
      type2_no_transaction: unitsWithSupplierButNoTransaction.length,
      total: allOrphans.length
    });

    return allOrphans;
  }

  /**
   * Create a recovery transaction to link orphaned units to a supplier
   */
  async createRecoveryTransaction(data: RecoveryTransaction): Promise<{ success: boolean; transaction_id?: string; errors?: string[] }> {
    const transactionId = await transactionCoordinator.beginTransaction({
      type: 'orphaned_units_recovery',
      supplier_id: data.supplier_id,
      unit_count: data.unit_ids.length
    });

    try {
      logger.info('🔄 Starting orphaned units recovery', {
        transactionId,
        supplier_id: data.supplier_id,
        unit_count: data.unit_ids.length
      });

      // Validate supplier exists
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('id', data.supplier_id)
        .eq('status', 'active')
        .single();

      if (supplierError || !supplier) {
        throw new Error('Supplier not found or inactive');
      }

      // Validate units exist and are orphaned
      const { data: units, error: unitsError } = await supabase
        .from('product_units')
        .select('id, product_id, serial_number, price, purchase_price, supplier_id')
        .in('id', data.unit_ids);

      if (unitsError) {
        throw new Error(`Failed to validate units: ${unitsError.message}`);
      }

      if (!units || units.length !== data.unit_ids.length) {
        throw new Error('Some units not found');
      }

      // Calculate total amount
      const estimatedPurchasePrice = data.estimated_purchase_price || 0;
      const totalAmount = units.length * estimatedPurchasePrice;

      // Create supplier transaction
      const { data: supplierTransaction, error: transactionError } = await supabase
        .from('supplier_transactions')
        .insert({
          supplier_id: data.supplier_id,
          type: 'recovery',
          status: 'completed',
          total_amount: totalAmount,
          transaction_date: new Date().toISOString(),
          transaction_number: `REC-${Date.now()}`, // Auto-generate recovery number
          notes: data.notes || `Recovery transaction for ${units.length} orphaned units`
        })
        .select('id')
        .single();

      if (transactionError || !supplierTransaction) {
        throw new Error(`Failed to create supplier transaction: ${transactionError?.message}`);
      }

      // Update units with supplier information
      const { error: updateError } = await supabase
        .from('product_units')
        .update({
          supplier_id: data.supplier_id,
          purchase_price: estimatedPurchasePrice || null,
          updated_at: new Date().toISOString()
        })
        .in('id', data.unit_ids);

      if (updateError) {
        throw new Error(`Failed to update units: ${updateError.message}`);
      }

      // Create transaction items for record keeping
      const transactionItems = units.map(unit => ({
        transaction_id: supplierTransaction.id,
        product_id: unit.product_id,
        quantity: 1,
        unit_cost: estimatedPurchasePrice || 0,
        total_cost: estimatedPurchasePrice || 0,
        product_unit_ids: [unit.id],
        unit_details: {
          serial_number: unit.serial_number,
          recovery: true
        }
      }));

      const { error: itemsError } = await supabase
        .from('supplier_transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        logger.warn('Failed to create transaction items (non-critical)', { error: itemsError });
      }

      await transactionCoordinator.commitTransaction(transactionId);

      logger.info('✅ Orphaned units recovery completed', {
        transactionId: supplierTransaction.id,
        supplier_name: supplier.name,
        units_recovered: units.length,
        total_amount: totalAmount
      });

      return {
        success: true,
        transaction_id: supplierTransaction.id
      };

    } catch (error) {
      logger.error('❌ Orphaned units recovery failed', { error, transactionId });
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get suggested recovery data based on draft information
   */
  async getSuggestedRecovery(draftData?: any): Promise<{
    supplier_id?: string;
    estimated_purchase_price?: number;
    notes?: string;
  }> {
    // Try to extract supplier information from draft data
    if (draftData?.supplierId) {
      return {
        supplier_id: draftData.supplierId,
        estimated_purchase_price: this.calculateAveragePurchasePrice(draftData.items),
        notes: `Recovery from draft: ${draftData.notes || 'Incomplete acquisition transaction'}`
      };
    }

    return {};
  }

  private calculateAveragePurchasePrice(items: any[]): number {
    if (!items || items.length === 0) return 0;
    
    const totalCost = items.reduce((sum, item) => {
      if (item.unitEntries && item.unitEntries.length > 0) {
        return sum + item.unitEntries.reduce((entrySum: number, entry: any) => entrySum + (entry.price || 0), 0);
      }
      return sum + (item.unitCost * item.quantity);
    }, 0);

    const totalUnits = items.reduce((sum, item) => {
      return sum + (item.unitEntries?.length || item.quantity || 0);
    }, 0);

    return totalUnits > 0 ? totalCost / totalUnits : 0;
  }
}

export const orphanedUnitsRecoveryService = new OrphanedUnitsRecoveryService();
