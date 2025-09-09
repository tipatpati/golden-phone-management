/**
 * Enhanced Supplier Acquisition Service with Unified Product Coordination
 * Integrates with UnifiedProductCoordinator for seamless cross-module synchronization
 */

import { supabase } from "@/integrations/supabase/client";
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";
import type { ProductFormData, UnitEntryForm } from "@/services/inventory/types";

export interface AcquisitionItem {
  productData: ProductFormData;
  unitEntries: UnitEntryForm[];
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface SupplierTransaction {
  id?: string;
  supplierId: string;
  type: 'acquisition' | 'return' | 'exchange';
  transactionDate: Date;
  items: AcquisitionItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

class SupplierAcquisitionServiceClass {
  /**
   * Enhanced product acquisition with unified coordination
   */
  async processAcquisition(transaction: SupplierTransaction): Promise<{ 
    transactionId: string; 
    createdProducts: string[]; 
    createdUnits: string[];
  }> {
    console.log('🚀 Processing supplier acquisition with unified coordination...');
    
    const createdProducts: string[] = [];
    const createdUnits: string[] = [];

    try {
      // Create supplier transaction record
      const transactionNumber = `TXN-${Date.now()}`;
      const { data: transactionRecord, error: transactionError } = await supabase
        .from('supplier_transactions')
        .insert({
          supplier_id: transaction.supplierId,
          type: transaction.type,
          transaction_date: transaction.transactionDate.toISOString(),
          total_amount: transaction.totalAmount,
          status: transaction.status,
          notes: transaction.notes || '',
          transaction_number: transactionNumber
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error(`Failed to create transaction: ${transactionError.message}`);
      }

      // Process each acquisition item with unified coordination
      for (const item of transaction.items) {
        await this.processAcquisitionItem(
          transactionRecord.id,
          item,
          createdProducts,
          createdUnits
        );
      }

      console.log(`✅ Acquisition complete: ${createdProducts.length} products, ${createdUnits.length} units`);
      
      return {
        transactionId: transactionRecord.id,
        createdProducts,
        createdUnits
      };

    } catch (error) {
      console.error('❌ Acquisition processing failed:', error);
      throw error;
    }
  }

  /**
   * Process individual acquisition item with unified product coordination
   */
  private async processAcquisitionItem(
    transactionId: string,
    item: AcquisitionItem,
    createdProducts: string[],
    createdUnits: string[]
  ): Promise<void> {
    console.log(`📦 Processing acquisition item: ${item.productData.brand} ${item.productData.model}`);

    // PHASE 3: Use unified product resolution
    const { product, isExisting } = await UnifiedProductCoordinator.resolveProduct(
      item.productData.brand,
      item.productData.model,
      {
        ...item.productData,
        price: item.unitCost, // Use acquisition cost as base price
        has_serial: item.unitEntries.length > 0
      }
    );

    if (!isExisting) {
      createdProducts.push(product.id);
      console.log(`✅ Created new product: ${product.id}`);
    } else {
      console.log(`🔄 Using existing product: ${product.id}`);
    }

    // PHASE 4: Notify about supplier product action
    UnifiedProductCoordinator.notifyEvent({
      type: isExisting ? 'product_updated' : 'product_created',
      source: 'supplier',
      entityId: product.id,
      metadata: {
        brand: item.productData.brand,
        model: item.productData.model,
        acquisition: true,
        transactionId,
        unitCost: item.unitCost
      }
    });

    // Create transaction item record
    const productUnitIds: string[] = [];
    
    // Process individual units if product has serial numbers
    if (item.unitEntries.length > 0) {
      for (const unitEntry of item.unitEntries) {
        const { unit, isExisting: unitExists } = await UnifiedProductCoordinator.resolveProductUnit(
          product.id,
          unitEntry.serial,
          {
            price: unitEntry.price || item.unitCost,
            min_price: unitEntry.min_price,
            max_price: unitEntry.max_price,
            battery_level: unitEntry.battery_level,
            color: unitEntry.color,
            storage: unitEntry.storage,
            ram: unitEntry.ram,
            purchase_price: item.unitCost,
            supplier_id: undefined, // Will be inferred from transaction
            status: 'available'
          }
        );

        if (!unitExists) {
          createdUnits.push(unit.id);
          productUnitIds.push(unit.id);
          console.log(`✅ Created new unit: ${unit.serial_number} (${unit.id})`);
        } else {
          productUnitIds.push(unit.id);
          console.log(`🔄 Using existing unit: ${unit.serial_number} (${unit.id})`);
        }

        // PHASE 4: Notify about supplier unit action
        UnifiedProductCoordinator.notifyEvent({
          type: unitExists ? 'unit_updated' : 'unit_created',
          source: 'supplier',
          entityId: unit.id,
          metadata: {
            productId: product.id,
            serialNumber: unitEntry.serial,
            acquisition: true,
            transactionId,
            unitCost: item.unitCost
          }
        });
      }
    }

    // Create supplier transaction item record
    await supabase
      .from('supplier_transaction_items')
      .insert({
        transaction_id: transactionId,
        product_id: product.id,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.totalCost,
        creates_new_product: !isExisting,
        product_unit_ids: productUnitIds as any,
        unit_details: {
          unitEntries: item.unitEntries,
          createdUnits: productUnitIds
        } as any
      });

    console.log(`✅ Acquisition item processed: ${product.id}`);
  }

  /**
   * Get acquisition history with cross-module awareness
   */
  async getAcquisitionHistory(
    supplierId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<SupplierTransaction[]> {
    console.log('📊 Fetching acquisition history...');

    let query = supabase
      .from('supplier_transactions')
      .select(`
        *,
        suppliers(name),
        supplier_transaction_items(
          *,
          products(brand, model, barcode),
          product_units(serial_number, barcode, status)
        )
      `)
      .order('transaction_date', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (dateFrom) {
      query = query.gte('transaction_date', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('transaction_date', dateTo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch acquisition history: ${error.message}`);
    }

    return (data || []).map(this.mapTransactionRecord);
  }

  /**
   * Validate acquisition data before processing
   */
  async validateAcquisition(transaction: SupplierTransaction): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate supplier exists
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('id', transaction.supplierId)
      .single();

    if (!supplier) {
      errors.push('Supplier not found');
    } else if (supplier.status !== 'active') {
      warnings.push('Supplier is not active');
    }

    // Validate items
    if (!transaction.items || transaction.items.length === 0) {
      errors.push('No items provided');
    }

    for (const [index, item] of transaction.items.entries()) {
      if (!item.productData.brand?.trim()) {
        errors.push(`Item ${index + 1}: Brand is required`);
      }
      if (!item.productData.model?.trim()) {
        errors.push(`Item ${index + 1}: Model is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }
      if (item.unitCost <= 0) {
        errors.push(`Item ${index + 1}: Unit cost must be positive`);
      }

      // Validate unit entries if provided
      const duplicateSerials = new Set<string>();
      for (const unit of item.unitEntries) {
        if (!unit.serial?.trim()) {
          errors.push(`Item ${index + 1}: All units must have serial numbers`);
        } else if (duplicateSerials.has(unit.serial)) {
          errors.push(`Item ${index + 1}: Duplicate serial number: ${unit.serial}`);
        } else {
          duplicateSerials.add(unit.serial);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Cancel acquisition transaction
   */
  async cancelAcquisition(transactionId: string): Promise<void> {
    console.log(`🚫 Cancelling acquisition transaction: ${transactionId}`);

    const { error } = await supabase
      .from('supplier_transactions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }

    // PHASE 4: Notify about transaction cancellation
    UnifiedProductCoordinator.notifyEvent({
      type: 'sync_requested',
      source: 'supplier',
      entityId: transactionId,
      metadata: {
        action: 'transaction_cancelled',
        transactionId
      }
    });

    console.log(`✅ Transaction cancelled: ${transactionId}`);
  }

  /**
   * Map database transaction record to our interface
   */
  private mapTransactionRecord(record: any): SupplierTransaction {
    return {
      id: record.id,
      supplierId: record.supplier_id,
      type: record.type,
      transactionDate: new Date(record.transaction_date),
      totalAmount: record.total_amount,
      status: record.status,
      notes: record.notes,
      items: (record.supplier_transaction_items || []).map((item: any) => ({
        productData: {
          brand: item.products?.brand || '',
          model: item.products?.model || '',
          barcode: item.products?.barcode,
          // Map other product fields as needed
        } as ProductFormData,
        unitEntries: item.unit_details?.unitEntries || [],
        quantity: item.quantity,
        unitCost: item.unit_cost,
        totalCost: item.total_cost
      }))
    };
  }
}

export const supplierAcquisitionService = new SupplierAcquisitionServiceClass();